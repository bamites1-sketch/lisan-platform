import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Send a direct chat message (Student <-> Admin)
 */
export const sendDirectMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { message, studentId: targetStudentId, attachmentUrl } = req.body;

    if (!message || !message.trim()) {
      throw new AppError('Message text is required', 400);
    }

    let studentId = '';
    let senderName = '';

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: { user: true }
      });
      if (!student) {
        throw new AppError('Student profile not found', 404);
      }
      studentId = student.id;
      senderName = `${student.firstName} ${student.lastName}`.trim();
    } else if (role === 'ADMIN') {
      if (!targetStudentId) {
        throw new AppError('Target student ID is required for admin messages', 400);
      }
      const student = await prisma.student.findUnique({
        where: { id: targetStudentId }
      });
      if (!student) {
        throw new AppError('Target student not found', 404);
      }
      studentId = targetStudentId;

      const admin = await prisma.admin.findUnique({
        where: { userId }
      });
      senderName = admin ? `${admin.firstName} ${admin.lastName}`.trim() : 'Lisan Admin';
    } else {
      throw new AppError('Only students and admins can participate in direct chat', 403);
    }

    // Create the message
    const savedMessage = await prisma.studentAdminMessage.create({
      data: {
        studentId,
        senderId: userId,
        senderRole: role,
        senderName,
        message: message.trim(),
        attachmentUrl: attachmentUrl || null,
        isRead: false
      }
    });

    // Send notifications
    if (role === 'STUDENT') {
      // Notify admins
      try {
        const adminUsers = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });

        for (const admin of adminUsers) {
          await prisma.notification.create({
            data: {
              recipientId: admin.id,
              role: 'ADMIN',
              type: 'CHAT_MESSAGE',
              title: `💬 New message from ${senderName}`,
              message: message.trim().slice(0, 100),
              icon: '💬',
              link: `/admin/dashboard?tab=student-chat&studentId=${studentId}`
            }
          });
        }
      } catch (e) {
        console.error('Failed to dispatch notification to admin:', e);
      }
    } else if (role === 'ADMIN') {
      // Notify student
      try {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { userId: true }
        });
        if (student) {
          await prisma.notification.create({
            data: {
              recipientId: student.userId,
              role: 'STUDENT',
              type: 'CHAT_MESSAGE',
              title: `💬 Admin message from ${senderName}`,
              message: message.trim().slice(0, 100),
              icon: '💬',
              link: '/student/chat'
            }
          });
        }
      } catch (e) {
        console.error('Failed to dispatch notification to student:', e);
      }
    }

    res.status(201).json({
      success: true,
      data: savedMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get direct messages for a conversation
 */
export const getDirectMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { studentId: paramStudentId } = req.params;
    const { after } = req.query;

    let studentId = '';

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId }
      });
      if (!student) throw new AppError('Student not found', 404);
      studentId = student.id;
    } else if (role === 'ADMIN') {
      if (!paramStudentId) {
        throw new AppError('Student ID parameter is required', 400);
      }
      studentId = paramStudentId;
    } else {
      throw new AppError('Unauthorized', 403);
    }

    const where: any = { studentId };
    if (after && typeof after === 'string') {
      where.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.studentAdminMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200
    });

    // Mark messages sent by opposite party as read
    const oppositeRole = role === 'STUDENT' ? 'ADMIN' : 'STUDENT';
    const unreadFromOpposite = messages.filter(m => m.senderRole === oppositeRole && !m.isRead);
    if (unreadFromOpposite.length > 0) {
      await prisma.studentAdminMessage.updateMany({
        where: {
          studentId,
          senderRole: oppositeRole,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin view: List all student conversations with last message & unread badge
 */
export const getAdminConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all students with their user details
    const students = await prisma.student.findMany({
      include: {
        user: { select: { email: true, status: true } },
        adminMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Get unread counts grouped by student
    const unreadMessages = await prisma.studentAdminMessage.groupBy({
      by: ['studentId'],
      where: {
        senderRole: 'STUDENT',
        isRead: false
      },
      _count: { id: true }
    });

    const unreadMap = new Map<string, number>();
    for (const item of unreadMessages) {
      unreadMap.set(item.studentId, item._count.id);
    }

    // Format conversation list
    const conversations = students.map(student => {
      const lastMsg = student.adminMessages[0] || null;
      const unreadCount = unreadMap.get(student.id) || 0;

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        email: student.user.email,
        status: student.user.status,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          message: lastMsg.message,
          senderRole: lastMsg.senderRole,
          createdAt: lastMsg.createdAt,
          isRead: lastMsg.isRead
        } : null,
        unreadCount
      };
    });

    // Sort: students with messages first by latest timestamp, then students without messages alphabetically
    conversations.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      return a.firstName.localeCompare(b.firstName);
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages in a conversation as read
 */
export const markDirectChatRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { studentId: paramStudentId } = req.params;

    let studentId = '';
    let oppositeRole = '';

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new AppError('Student not found', 404);
      studentId = student.id;
      oppositeRole = 'ADMIN';
    } else if (role === 'ADMIN') {
      if (!paramStudentId) throw new AppError('Student ID is required', 400);
      studentId = paramStudentId;
      oppositeRole = 'STUDENT';
    } else {
      throw new AppError('Unauthorized', 403);
    }

    const result = await prisma.studentAdminMessage.updateMany({
      where: {
        studentId,
        senderRole: oppositeRole,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      updatedCount: result.count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread messages count for current user
 */
export const getDirectChatUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let unreadCount = 0;

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) {
        unreadCount = await prisma.studentAdminMessage.count({
          where: {
            studentId: student.id,
            senderRole: 'ADMIN',
            isRead: false
          }
        });
      }
    } else if (role === 'ADMIN') {
      unreadCount = await prisma.studentAdminMessage.count({
        where: {
          senderRole: 'STUDENT',
          isRead: false
        }
      });
    }

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};
