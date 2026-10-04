import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  sendDirectMessage,
  getDirectMessages,
  getAdminConversations,
  markDirectChatRead,
  getDirectChatUnreadCount
} from '../controllers/directChat.controller';

const router = express.Router();

router.use(authenticate);

// Unread count (accessible to both student and admin)
router.get('/unread-count', getDirectChatUnreadCount);

// Send message (accessible to both student and admin)
router.post('/messages', sendDirectMessage);

// Student gets own messages with admin
router.get('/messages', authorize('STUDENT'), getDirectMessages);

// Student marks admin messages as read
router.put('/read', authorize('STUDENT'), markDirectChatRead);

// Admin routes:
// Get all student conversations list
router.get('/conversations', authorize('ADMIN'), getAdminConversations);

// Admin gets messages for a specific student
router.get('/messages/:studentId', authorize('ADMIN'), getDirectMessages);

// Admin marks student messages as read
router.put('/read/:studentId', authorize('ADMIN'), markDirectChatRead);

export default router;
