import express from 'express';
import { sendContactMessage } from '../controllers/contact.controller';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate-limit: max 5 contact form submissions per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again in an hour.' },
});

router.post('/', contactLimiter, sendContactMessage);

export default router;
