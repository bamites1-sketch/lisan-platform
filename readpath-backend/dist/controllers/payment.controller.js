"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectPayment = exports.approvePayment = exports.getReceiptUrl = exports.listAllPayments = exports.getMySubmissions = exports.submitPayment = exports.upload = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notification_controller_1 = require("./notification.controller");
const multer_1 = __importDefault(require("multer"));
const r2storage_1 = require("../lib/r2storage");
// ─── Multer configuration (memory storage for R2) ─────────────────────────────
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
// ─── Submit payment (student/parent) ──────────────────────────────────────────
const submitPayment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { package: pkg, amount, paymentMethod, transactionRef, paymentDate, notes } = req.body;
        const file = req.file;
        // Validation (transactionRef now optional)
        const errors = {};
        if (!pkg?.trim())
            errors.package = 'Payment package is required.';
        if (!amount || amount <= 0)
            errors.amount = 'Amount must be greater than 0.';
        if (!paymentMethod?.trim())
            errors.paymentMethod = 'Payment method is required.';
        if (!paymentDate?.trim())
            errors.paymentDate = 'Payment date is required.';
        // Only require receipt file when R2 is configured and can actually store it
        if (!file && (0, r2storage_1.isR2Configured)())
            errors.receipt = 'Receipt screenshot is required.';
        if (Object.keys(errors).length) {
            res.status(422).json({ success: false, errors });
            return;
        }
        // Prevent duplicate pending submissions
        const existing = await prisma_1.default.paymentSubmission.findFirst({
            where: { userId, status: 'PENDING' },
        });
        if (existing) {
            res.status(409).json({
                success: false,
                message: 'You already have a pending payment submission. Please wait for admin review.',
            });
            return;
        }
        // Upload receipt to R2
        let receiptKey = null;
        if (file) {
            const result = await (0, r2storage_1.uploadToR2)(file, r2storage_1.FileCategory.RECEIPT);
            receiptKey = result.key;
        }
        const submission = await prisma_1.default.paymentSubmission.create({
            data: {
                userId,
                package: pkg.trim(),
                amount: Number(amount),
                paymentMethod: paymentMethod.trim(),
                transactionRef: transactionRef?.trim() || '',
                paymentDate: paymentDate.trim(),
                receiptUrl: receiptKey, // Store R2 key
                notes: notes?.trim() ?? null,
                status: 'PENDING',
            },
        });
        // Update user status to PAYMENT_PENDING
        await prisma_1.default.user.update({ where: { id: userId }, data: { status: 'PAYMENT_PENDING' } });
        res.status(201).json({
            success: true,
            message: 'Payment submitted successfully. An admin will review your payment soon.',
            data: submission,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitPayment = submitPayment;
// ─── Get my submissions (student/parent) ──────────────────────────────────────
const getMySubmissions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const submissions = await prisma_1.default.paymentSubmission.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: submissions });
    }
    catch (error) {
        next(error);
    }
};
exports.getMySubmissions = getMySubmissions;
// ─── List all submissions (admin) ─────────────────────────────────────────────
const listAllPayments = async (_req, res, next) => {
    try {
        const submissions = await prisma_1.default.paymentSubmission.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true, email: true, role: true, status: true,
                        student: { select: { firstName: true, lastName: true, grade: true } },
                        parent: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
        res.json({ success: true, data: submissions });
    }
    catch (error) {
        next(error);
    }
};
exports.listAllPayments = listAllPayments;
// ─── Get signed URL for receipt viewing (admin only) ──────────────────────────
const getReceiptUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const submission = await prisma_1.default.paymentSubmission.findUnique({ where: { id } });
        if (!submission)
            throw new errorHandler_1.AppError('Payment submission not found.', 404);
        if (!submission.receiptUrl)
            throw new errorHandler_1.AppError('No receipt available.', 404);
        // If R2 not configured, the receipt was not stored
        if (!(0, r2storage_1.isR2Configured)() || submission.receiptUrl.startsWith('__no_storage__/')) {
            throw new errorHandler_1.AppError('File storage is not configured. Receipt was not saved.', 503);
        }
        // Generate signed URL (valid for 1 hour)
        const { getSignedDownloadUrl } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
        const signedUrl = await getSignedDownloadUrl(submission.receiptUrl, 3600);
        res.json({ success: true, data: { url: signedUrl } });
    }
    catch (error) {
        next(error);
    }
};
exports.getReceiptUrl = getReceiptUrl;
// ─── Approve payment (admin) ──────────────────────────────────────────────────
const approvePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const submission = await prisma_1.default.paymentSubmission.findUnique({ where: { id } });
        if (!submission)
            throw new errorHandler_1.AppError('Payment submission not found.', 404);
        if (submission.status !== 'PENDING')
            throw new errorHandler_1.AppError('Submission is already reviewed.', 400);
        // Approve the submission
        await prisma_1.default.paymentSubmission.update({
            where: { id },
            data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: adminId },
        });
        // Activate the user account
        await prisma_1.default.user.update({ where: { id: submission.userId }, data: { status: 'ACTIVE' } });
        // Notify the user
        await (0, notification_controller_1.createNotification)({
            recipientId: submission.userId,
            role: 'STUDENT',
            type: 'payment_approved',
            title: '✅ Payment Approved',
            message: `Your payment for "${submission.package}" has been approved. Your account is now active — welcome to LISAN!`,
            icon: '✅',
            link: '/student/dashboard',
            meta: { package: submission.package },
        }).catch(() => { });
        res.json({ success: true, message: 'Payment approved. Account is now active.' });
    }
    catch (error) {
        next(error);
    }
};
exports.approvePayment = approvePayment;
// ─── Reject payment (admin) ───────────────────────────────────────────────────
const rejectPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const { reason } = req.body;
        const submission = await prisma_1.default.paymentSubmission.findUnique({ where: { id } });
        if (!submission)
            throw new errorHandler_1.AppError('Payment submission not found.', 404);
        if (submission.status !== 'PENDING')
            throw new errorHandler_1.AppError('Submission is already reviewed.', 400);
        const adminNote = reason?.trim() || 'Your payment could not be verified. Please resubmit with the correct details.';
        await prisma_1.default.paymentSubmission.update({
            where: { id },
            data: { status: 'REJECTED', adminNote, reviewedAt: new Date(), reviewedBy: adminId },
        });
        // Revert user status to PENDING so they can resubmit
        await prisma_1.default.user.update({ where: { id: submission.userId }, data: { status: 'PENDING' } });
        // Delete rejected receipt from R2 to save storage
        if (submission.receiptUrl) {
            try {
                await (0, r2storage_1.deleteFromR2)(submission.receiptUrl);
            }
            catch (err) {
                console.error('Failed to delete rejected receipt from R2:', err);
            }
        }
        // Notify the user with the reason
        await (0, notification_controller_1.createNotification)({
            recipientId: submission.userId,
            role: 'STUDENT',
            type: 'payment_rejected',
            title: '❌ Payment Not Verified',
            message: `Your payment submission was not approved. Reason: ${adminNote} Please resubmit with the correct details.`,
            icon: '❌',
            link: '/payment',
            meta: { package: submission.package, reason: adminNote },
        }).catch(() => { });
        res.json({ success: true, message: 'Payment rejected. User notified.' });
    }
    catch (error) {
        next(error);
    }
};
exports.rejectPayment = rejectPayment;
//# sourceMappingURL=payment.controller.js.map