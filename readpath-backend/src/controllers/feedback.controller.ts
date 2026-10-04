import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

// ─── Parent Feedback Controllers ─────────────────────────────────────────────

/**
 * Parent creates a new feedback submission
 */
export const createParentFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const {
      studentId,
      category = 'GENERAL',
      rating,
      title,
      progressNotes,
      areasOfConcern,
      suggestions
    } = req.body;

    if (!progressNotes && !areasOfConcern && !suggestions) {
      throw new AppError('Please provide at least one feedback detail (progress, concern, or suggestion)', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { parent: true }
    });

    if (!user || !user.parent) {
      throw new AppError('Parent profile not found', 404);
    }

    const parentId = user.parent.id;

    // Verify student if provided belongs to this parent
    if (studentId) {
      const student = await prisma.student.findFirst({
        where: { id: studentId, parentId }
      });
      if (!student) {
        throw new AppError('Student not associated with this parent', 400);
      }
    }

    const feedback = await prisma.parentFeedback.create({
      data: {
        parentId,
        studentId: studentId || null,
        category,
        rating: rating ? Number(rating) : null,
        title: title || null,
        progressNotes: progressNotes || null,
        areasOfConcern: areasOfConcern || null,
        suggestions: suggestions || null,
        status: 'PENDING'
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, grade: true }
        }
      }
    });

    // Notify Admins
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      const parentName = `${user.parent.firstName} ${user.parent.lastName}`.trim();
      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            recipientId: admin.id,
            role: 'ADMIN',
            type: 'PARENT_FEEDBACK',
            title: 'New Parent Feedback',
            message: `${parentName} submitted feedback${title ? `: "${title}"` : ''}.`,
            icon: '💬',
            link: '/admin/dashboard?tab=parent-feedback'
          }
        });
      }
    } catch (e) {
      console.error('Failed to dispatch notification to admins:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Parent retrieves their submitted feedbacks and admin responses
 */
export const getMyParentFeedbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { parent: true }
    });

    if (!user || !user.parent) {
      throw new AppError('Parent profile not found', 404);
    }

    const feedbacks = await prisma.parentFeedback.findMany({
      where: { parentId: user.parent.id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, grade: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin retrieves all parent feedbacks
 */
export const getAdminParentFeedbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, category, studentId, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }
    if (studentId && typeof studentId === 'string') {
      where.studentId = studentId;
    }

    const feedbacks = await prisma.parentFeedback.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true, phone: true } }
          }
        },
        student: {
          select: { id: true, firstName: true, lastName: true, grade: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let filtered = feedbacks;
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = feedbacks.filter(f => 
        f.parent.firstName.toLowerCase().includes(q) ||
        f.parent.lastName.toLowerCase().includes(q) ||
        (f.student && `${f.student.firstName} ${f.student.lastName}`.toLowerCase().includes(q)) ||
        (f.title && f.title.toLowerCase().includes(q)) ||
        (f.progressNotes && f.progressNotes.toLowerCase().includes(q)) ||
        (f.areasOfConcern && f.areasOfConcern.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      data: filtered,
      counts: {
        total: feedbacks.length,
        pending: feedbacks.filter(f => f.status === 'PENDING').length,
        reviewed: feedbacks.filter(f => f.status === 'REVIEWED' || f.status === 'RESOLVED').length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin responds to a parent feedback
 */
export const respondToParentFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { adminResponse, status = 'REVIEWED' } = req.body;
    const adminUserId = req.user!.userId;

    if (!adminResponse || !adminResponse.trim()) {
      throw new AppError('Admin response message cannot be empty', 400);
    }

    const existing = await prisma.parentFeedback.findUnique({
      where: { id },
      include: { parent: { include: { user: true } } }
    });

    if (!existing) {
      throw new AppError('Feedback not found', 404);
    }

    // Get admin name
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      include: { admin: true }
    });
    const responderName = adminUser?.admin
      ? `${adminUser.admin.firstName} ${adminUser.admin.lastName}`.trim()
      : 'Admin';

    const updated = await prisma.parentFeedback.update({
      where: { id },
      data: {
        adminResponse: adminResponse.trim(),
        status,
        respondedAt: new Date(),
        respondedBy: responderName
      },
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true }
        },
        student: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Notify Parent
    try {
      await prisma.notification.create({
        data: {
          recipientId: existing.parent.userId,
          role: 'PARENT',
          type: 'ADMIN_RESPONSE',
          title: 'Admin Responded to Your Feedback',
          message: `${responderName} responded to your feedback${existing.title ? ` regarding "${existing.title}"` : ''}.`,
          icon: '📬',
          link: '/parent/feedback'
        }
      });
    } catch (e) {
      console.error('Failed to notify parent:', e);
    }

    res.json({
      success: true,
      message: 'Response sent to parent successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin deletes a parent feedback
 */
export const deleteParentFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await prisma.parentFeedback.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
