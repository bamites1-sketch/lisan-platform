import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
} from '../controllers/notification.controller';

const router = express.Router();
router.use(authenticate); // all notification routes require auth

router.get('/',                  getNotifications);
router.get('/unread-count',      getUnreadCount);
router.patch('/read-all',        markAllRead);
router.patch('/:id/read',        markRead);
router.delete('/clear-all',      clearAll);
router.delete('/:id',            deleteNotification);

export default router;
