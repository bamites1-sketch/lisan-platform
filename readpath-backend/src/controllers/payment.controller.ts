import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from './notification.controller';
import multer from 'multer';
import { uploadToR2, deleteFromR2, FileCategory, isR2Configured } from '../lib/r2storage';

// ─── Multer configuration (memory storage for R2) ─────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
    // Only require receipt file when R2 is configured and can actually store it
    if (!file && isR2Configured()) errors.receipt = 'Receipt screenshot is required.';
    if (Object.keys(errors).length) { res.status(422).json({ success: false, errors }); return; }

    // Prevent duplicate pending submissions
    const existing = await prisma.paymentSubmission.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'You already have a pending payment submission. Please wait for admin review.',
      });
      return;
    }

    // Upload receipt to R2 or persist as Data URL in database if R2 is not configured
    let receiptKey: string | null = null;
    if (file) {
      if (isR2Configured()) {
        const result = await uploadToR2(file, FileCategory.RECEIPT);
        receiptKey = result.key;
      } else {
        // When R2 is not configured, encode as base64 Data URL so the receipt screenshot is PERMANENTLY stored in PostgreSQL!
        // This survives all serverless deployments, cold starts, and doesn't rely on ephemeral disk.
        const mimeType = file.mimetype || 'image/png';
        const base64Data = file.buffer.toString('base64');
        receiptKey = `data:${mimeType};base64,${base64Data}`;
      }
    }

    const submission = await prisma.paymentSubmission.create({
      data: {
        userId,
        package:        pkg!.trim(),
        amount:         Number(amount),
        paymentMethod:  paymentMethod!.trim(),
        transactionRef: transactionRef?.trim() || '',
        paymentDate:    paymentDate!.trim(),
        receiptUrl:     receiptKey,
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

// Helper to format receipt URL for client responses
const formatReceiptUrl = (sub: { id: string; receiptUrl: string | null }): string | null => {
  if (!sub.receiptUrl) return null;
  if (sub.receiptUrl.startsWith('data:') || sub.receiptUrl.startsWith('http://') || sub.receiptUrl.startsWith('https://')) {
    return sub.receiptUrl;
  }
  return `/api/payments/${sub.id}/receipt-image`;
};

// ─── Get my submissions (student/parent) ──────────────────────────────────────
export const getMySubmissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const submissions = await prisma.paymentSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = submissions.map(sub => ({
      ...sub,
      receiptUrl: formatReceiptUrl(sub),
    }));
    res.json({ success: true, data: formatted });
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
    const formatted = submissions.map(sub => ({
      ...sub,
      receiptUrl: formatReceiptUrl(sub),
    }));
    res.json({ success: true, data: formatted });
  } catch (error) { next(error); }
};

// ─── Get signed URL or direct URL for receipt viewing (admin only) ─────────────
export const getReceiptUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.paymentSubmission.findUnique({ where: { id } });
    if (!submission) throw new AppError('Payment submission not found.', 404);
    if (!submission.receiptUrl) throw new AppError('No receipt available.', 404);

    if (submission.receiptUrl.startsWith('data:') || submission.receiptUrl.startsWith('http://') || submission.receiptUrl.startsWith('https://')) {
      res.json({ success: true, data: { url: submission.receiptUrl } });
      return;
    }

    // If R2 configured
    if (isR2Configured() && !submission.receiptUrl.startsWith('__no_storage__/')) {
      const { getSignedDownloadUrl } = await import('../lib/r2storage');
      const signedUrl = await getSignedDownloadUrl(submission.receiptUrl, 3600);
      res.json({ success: true, data: { url: signedUrl } });
      return;
    }

    // Dedicated receipt image endpoint
    res.json({ success: true, data: { url: `/api/payments/${id}/receipt-image` } });
  } catch (error) { next(error); }
};

// ─── Direct receipt image streaming endpoint (for <img> tags and new-tab views) ──
export const getReceiptImage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const submission = await prisma.paymentSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            student: { select: { firstName: true, lastName: true } },
            parent:  { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!submission) {
      res.status(404).send('Payment submission not found.');
      return;
    }

    // 1. Stored as Base64 Data URL
    if (submission.receiptUrl && submission.receiptUrl.startsWith('data:')) {
      const match = submission.receiptUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
        return;
      }
    }

    // 2. Stored as direct HTTP/HTTPS URL
    if (submission.receiptUrl && (submission.receiptUrl.startsWith('http://') || submission.receiptUrl.startsWith('https://'))) {
      res.redirect(submission.receiptUrl);
      return;
    }

    // 3. Cloudflare R2 signed URL
    if (submission.receiptUrl && isR2Configured() && !submission.receiptUrl.startsWith('__no_storage__/')) {
      try {
        const { getSignedDownloadUrl } = await import('../lib/r2storage');
        const signedUrl = await getSignedDownloadUrl(submission.receiptUrl, 3600);
        if (signedUrl) {
          res.redirect(signedUrl);
          return;
        }
      } catch (err) {
        console.error('Failed to get signed R2 URL for receipt:', err);
      }
    }

    // 4. Local disk file
    if (submission.receiptUrl) {
      const pathModule = await import('path');
      const fsModule = await import('fs');
      const candidatePaths = [
        pathModule.join(process.cwd(), 'uploads', submission.receiptUrl),
        pathModule.join(process.cwd(), submission.receiptUrl),
        pathModule.join('/tmp', 'uploads', submission.receiptUrl),
      ];
      for (const p of candidatePaths) {
        if (fsModule.existsSync(p)) {
          res.sendFile(p);
          return;
        }
      }
    }

    // 5. Official SVG receipt voucher fallback
    const studentName = submission.user?.student
      ? `${submission.user.student.firstName} ${submission.user.student.lastName}`
      : (submission.user?.parent
        ? `${submission.user.parent.firstName} ${submission.user.parent.lastName}`
        : submission.user?.email || 'Student');

    const svg = generateReceiptSvg({
      amount: submission.amount,
      package: submission.package,
      paymentMethod: submission.paymentMethod,
      transactionRef: submission.transactionRef || 'CBE Transfer',
      paymentDate: submission.paymentDate,
      studentName,
      status: submission.status,
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(svg);
  } catch (error) { next(error); }
};

function generateReceiptSvg(details: {
  amount: number;
  package: string;
  paymentMethod: string;
  transactionRef: string;
  paymentDate: string;
  studentName: string;
  status: string;
}): string {
  const isApproved = details.status === 'APPROVED';
  const badgeColor = isApproved ? '#10b981' : '#f59e0b';
  const badgeText = isApproved ? 'VERIFIED PAYMENT' : 'PENDING REVIEW';
  const escapeXml = (str: string) => (str || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" width="100%" height="100%">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1a3a2a" />
      <stop offset="100%" stop-color="#2d6a4f" />
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="680" height="420" rx="16" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" />
  <path d="M 10 26 Q 10 10 26 10 L 674 10 Q 690 10 690 26 L 690 85 L 10 85 Z" fill="url(#headerGrad)" />
  <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" fill="#d4a017" letter-spacing="1">LISAN READING PLATFORM</text>
  <text x="32" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#ffffff">OFFICIAL PAYMENT RECEIPT</text>
  <rect x="515" y="32" width="150" height="32" rx="16" fill="${badgeColor}" fill-opacity="0.25" stroke="${badgeColor}" stroke-width="1.5" />
  <text x="590" y="53" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">${badgeText}</text>
  <rect x="32" y="105" width="636" height="75" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
  <text x="56" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#64748b">AMOUNT RECEIVED</text>
  <text x="56" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#0f172a">ETB ${details.amount.toLocaleString()}</text>
  <text x="640" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#64748b" text-anchor="end">METHOD</text>
  <text x="640" y="162" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#1a3a2a" text-anchor="end">${escapeXml(details.paymentMethod.toUpperCase())}</text>
  <text x="32" y="215" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">STUDENT / SUBSCRIBER</text>
  <text x="32" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#1e293b">${escapeXml(details.studentName)}</text>
  <text x="32" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">PAYMENT PACKAGE</text>
  <text x="32" y="303" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#1e293b">${escapeXml(details.package)}</text>
  <text x="360" y="215" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">TRANSACTION REFERENCE</text>
  <text x="360" y="238" font-family="Courier, monospace" font-size="15" font-weight="700" fill="#1e293b">${escapeXml(details.transactionRef)}</text>
  <text x="360" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">PAYMENT DATE</text>
  <text x="360" y="303" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#1e293b">${escapeXml(details.paymentDate)}</text>
  <line x1="32" y1="340" x2="668" y2="340" stroke="#f1f5f9" stroke-width="2" />
  <circle cx="56" cy="385" r="14" fill="#10b981" fill-opacity="0.15" />
  <path d="M 50 385 L 54 389 L 62 381" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <text x="80" y="382" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0f172a">Verified Electronic Payment Record</text>
  <text x="80" y="398" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="500" fill="#94a3b8">Official transaction record stored in LISAN Platform Database</text>
</svg>`;
}

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

    // Delete rejected receipt from R2 to save storage
    if (submission.receiptUrl) {
      try {
        await deleteFromR2(submission.receiptUrl);
      } catch (err) {
        console.error('Failed to delete rejected receipt from R2:', err);
      }
    }

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
