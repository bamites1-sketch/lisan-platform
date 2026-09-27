"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAll = exports.deleteNotification = exports.markAllRead = exports.markRead = exports.getUnreadCount = exports.getNotifications = void 0;
exports.createNotification = createNotification;
exports.broadcastToRole = broadcastToRole;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// ─── Internal helper — used by other controllers to fan-out notifications ─────
async function createNotification(data) {
    return prisma_1.default.notification.create({
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
async function broadcastToRole(role, data) {
    const users = await prisma_1.default.user.findMany({
        where: { role },
        select: { id: true },
    });
    await Promise.all(users.map(u => createNotification({ ...data, recipientId: u.id, role })));
}
// ─── GET /api/notifications ───────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { limit = '50', offset = '0', unreadOnly } = req.query;
        const notifications = await prisma_1.default.notification.findMany({
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
            meta: n.meta ? (() => { try {
                return JSON.parse(n.meta);
            }
            catch {
                return {};
            } })() : {},
        }));
        res.json({ success: true, data: parsed });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
// ─── GET /api/notifications/unread-count ─────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await prisma_1.default.notification.count({
            where: { recipientId: req.user.userId, read: false },
        });
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnreadCount = getUnreadCount;
// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
const markRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await prisma_1.default.notification.findUnique({ where: { id } });
        if (!notification)
            throw new errorHandler_1.AppError('Notification not found', 404);
        if (notification.recipientId !== req.user.userId)
            throw new errorHandler_1.AppError('Forbidden', 403);
        await prisma_1.default.notification.update({ where: { id }, data: { read: true } });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.markRead = markRead;
// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
const markAllRead = async (req, res, next) => {
    try {
        await prisma_1.default.notification.updateMany({
            where: { recipientId: req.user.userId, read: false },
            data: { read: true },
        });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllRead = markAllRead;
// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await prisma_1.default.notification.findUnique({ where: { id } });
        if (!notification)
            throw new errorHandler_1.AppError('Notification not found', 404);
        if (notification.recipientId !== req.user.userId)
            throw new errorHandler_1.AppError('Forbidden', 403);
        await prisma_1.default.notification.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotification = deleteNotification;
// ─── DELETE /api/notifications (clear all for current user) ──────────────────
const clearAll = async (req, res, next) => {
    try {
        await prisma_1.default.notification.deleteMany({ where: { recipientId: req.user.userId } });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.clearAll = clearAll;
//# sourceMappingURL=notification.controller.js.map