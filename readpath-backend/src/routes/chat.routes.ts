import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { sendMessage, getChatHistory } from '../controllers/chat.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/messages', sendMessage);
router.get('/history', getChatHistory);

export default router;
