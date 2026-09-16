import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from './notification.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ─── File upload configuration ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (allowed.test(ext) && (mime.startsWith('image/') || mime === 'application/pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// ─── Submit payment (student/parent) ──────────────────────────────────────────
export const submitPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { package: pkg, amount, paymentMethod, transactionRef, paymentDate, notes } = req.body as {
      package?: string; amount?: number; paymentMethod?: string;
      transactionRef?: string; paymentDate?: string; notes?: string;
    };

    const file = (req as any).file as Express.Multer.File | undefined;

    // Validation (transactionRef now optional)
    const errors: Record<string, string> = {};
    if (!pkg?.trim())            errors.package        = 'Payment package is required.';
    if (!amount || amount <= 0)  errors.amount         = 'Amount must be greater than 0.';
    if (!paymentMethod?.trim())  errors.paymentMethod  = 'Payment method is required.';
    if (!paymentDate?.trim())    errors.paymentDate    = 'Payment date is required.';
    if (!file)                   errors.receipt        = 'Receipt screenshot is required.';
    if (Object.keys(errors).length) { res.status(422).json({ success: false, errors }); return; }

    // Prevent duplicate pending submissions
    const existing = await prisma.paymentSubmission.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (existing) {
      // Delete uploaded file if submission fails
      if (file) fs.unlinkSync(file.path);
      res.status(409).json({
        success: false,
        message: 'You already have a pending payment submission. Please wait for admin review.',
      });
      return;
    }

    const receiptUrl = file ? `/uploads/receipts/${file.filename}` : null;

    const submission = await prisma.paymentSubmission.create({
      data: {
        userId,
        package:        pkg!.trim(),
        amount:         Number(amount),
        paymentMethod:  paymentMethod!.trim(),
        transactionRef: transactionRef?.trim() || '',
        paymentDate:    paymentDate!.trim(),
        receiptUrl,
        notes:          notes?.trim() ?? null,
        status:         'PENDING',
      },
    });

    // Update user status to PAYMENT_PENDING
    await prisma.user.update({ where: { id: userId }, data: { status: 'PAYMENT_PENDING' } });

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. An admin will review your payment soon.',
      data: submission,
    });
  } catch (error) { next(error); }
};

// ─── Get my submissions (student/parent) ──────────────────────────────────────
export const getMySubmissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const submissions = await prisma.paymentSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (error) { next(error); }
};

// ─── List all submissions (admin) ─────────────────────────────────────────────
export const listAllPayments = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const submissions = await prisma.paymentSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, email: true, role: true, status: true,
            student: { select: { firstName: true, lastName: true, grade: true } },
            parent:  { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    res.json({ success: true, data: submissions });
  } catch (error) { next(error); }
};

// ─── Approve payment (admin) ──────────────────────────────────────────────────
export const approvePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    const submission = await prisma.paymentSubmission.findUnique({ where: { id } });
    if (!submission) throw new AppError('Payment submission not found.', 404);
    if (submission.status !== 'PENDING') throw new AppError('Submission is already reviewed.', 400);

    // Approve the submission
    await prisma.paymentSubmission.update({
      where: { id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: adminId },
    });

    // Activate the user account
    await prisma.user.update({ where: { id: submission.userId }, data: { status: 'ACTIVE' } });

    // Notify the user
    await createNotification({
      recipientId: submission.userId,
      role: 'STUDENT',
      type: 'payment_approved',
      title: '✅ Payment Approved',
      message: `Your payment for "${submission.package}" has been approved. Your account is now active — welcome to LISAN!`,
      icon: '✅',
      link: '/student/dashboard',
      meta: { package: submission.package },
    }).catch(() => {});

    res.json({ success: true, message: 'Payment approved. Account is now active.' });
  } catch (error) { next(error); }
};

// ─── Reject payment (admin) ───────────────────────────────────────────────────
export const rejectPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const { reason } = req.body as { reason?: string };

    const submission = await prisma.paymentSubmission.findUnique({ where: { id } });
    if (!submission) throw new AppError('Payment submission not found.', 404);
    if (submission.status !== 'PENDING') throw new AppError('Submission is already reviewed.', 400);

    const adminNote = reason?.trim() || 'Your payment could not be verified. Please resubmit with the correct details.';

    await prisma.paymentSubmission.update({
      where: { id },
      data: { status: 'REJECTED', adminNote, reviewedAt: new Date(), reviewedBy: adminId },
    });

    // Revert user status to PENDING so they can resubmit
    await prisma.user.update({ where: { id: submission.userId }, data: { status: 'PENDING' } });

    // Notify the user with the reason
    await createNotification({
      recipientId: submission.userId,
      role: 'STUDENT',
      type: 'payment_rejected',
      title: '❌ Payment Not Verified',
      message: `Your payment submission was not approved. Reason: ${adminNote} Please resubmit with the correct details.`,
      icon: '❌',
      link: '/payment',
      meta: { package: submission.package, reason: adminNote },
    }).catch(() => {});

    res.json({ success: true, message: 'Payment rejected. User notified.' });
  } catch (error) { next(error); }
};
