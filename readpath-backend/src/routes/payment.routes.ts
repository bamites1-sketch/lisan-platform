import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  submitPayment, getMySubmissions,
  listAllPayments, approvePayment, rejectPayment, upload,
} from '../controllers/payment.controller';

const router = express.Router();
router.use(authenticate);

// Student / Parent — submit and view their own submissions
router.post('/',     authorize('STUDENT', 'PARENT'), upload.single('receipt'), submitPayment);
router.get('/mine',  authorize('STUDENT', 'PARENT'), getMySubmissions);

// Admin — list all + approve/reject
router.get('/',            authorize('ADMIN'), listAllPayments);
router.post('/:id/approve', authorize('ADMIN'), approvePayment);
router.post('/:id/reject',  authorize('ADMIN'), rejectPayment);

export default router;
