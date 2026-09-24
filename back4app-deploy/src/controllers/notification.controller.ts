import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

// ─── Internal helper — used by other controllers to fan-out notifications ─────
export async function createNotification(data: {
  recipientId: string;   // User.id
  role: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  meta?: Record<string, string>;
}) {
  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      role: data.role,
      type: data.type,
      title: data.title,
      message: data.message,
      icon: data.icon ?? '🔔',
      link: data.link,
      meta: data.meta ? JSON.stringify(data.meta) : undefined,
    },
  });
}

/**
 * Fan-out helper — send the same notification to every user matching a role.
 * Used for "broadcast to all teachers" or "broadcast to all admins".
 */
export async function broadcastToRole(
  role: string,
  data: Omit<Parameters<typeof createNotification>[0], 'recipientId' | 'role'>
) {
  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true },
  });
  await Promise.all(
    users.map(u => createNotification({ ...data, recipientId: u.id, role }))
  );
}

// ─── GET /api/notifications ───────────────────────────────────────────────────
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { limit = '50', offset = '0', unreadOnly } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(unreadOnly === 'true' ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
      skip: parseInt(String(offset)),
    });

    // Parse meta JSON for each notification
    const parsed = notifications.map(n => ({
      ...n,
      meta: n.meta ? (() => { try { return JSON.parse(n.meta!) } catch { return {} } })() : {},
    }));

    res.json({ success: true, data: parsed });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await prisma.notification.count({
      where: { recipientId: req.user!.userId, read: false },
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
export const markRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.recipientId !== req.user!.userId) throw new AppError('Forbidden', 403);

    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
export const markAllRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.recipientId !== req.user!.userId) throw new AppError('Forbidden', 403);

    await prisma.notification.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/notifications (clear all for current user) ──────────────────
export const clearAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.notification.deleteMany({ where: { recipientId: req.user!.userId } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
