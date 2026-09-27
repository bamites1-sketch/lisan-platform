import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function createNotification(data: {
    recipientId: string;
    role: string;
    type: string;
    title: string;
    message: string;
    icon?: string;
    link?: string;
    meta?: Record<string, string>;
}): Promise<{
    meta: string | null;
    link: string | null;
    id: string;
    role: string;
    createdAt: Date;
    title: string;
    type: string;
    message: string;
    icon: string;
    read: boolean;
    recipientId: string;
}>;
/**
 * Fan-out helper — send the same notification to every user matching a role.
 * Used for "broadcast to all teachers" or "broadcast to all admins".
 */
export declare function broadcastToRole(role: string, data: Omit<Parameters<typeof createNotification>[0], 'recipientId' | 'role'>): Promise<void>;
export declare const getNotifications: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUnreadCount: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const markRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const markAllRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteNotification: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const clearAll: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=notification.controller.d.ts.map