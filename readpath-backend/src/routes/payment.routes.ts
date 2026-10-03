import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  submitPayment, getMySubmissions, getReceiptUrl, getReceiptImage,
  listAllPayments, approvePayment, rejectPayment, upload,
} from '../controllers/payment.controller';

const router = express.Router();

// Direct receipt image route (accessible to <img> tags & preview tabs by submission UUID)
router.get('/:id/receipt-image', getReceiptImage);

router.use(authenticate);

// Student / Parent — submit and view their own submissions
router.post('/',     authorize('STUDENT', 'PARENT'), upload.single('receipt'), submitPayment);
router.get('/mine',  authorize('STUDENT', 'PARENT'), getMySubmissions);

// Admin — list all + approve/reject + view receipt
router.get('/',             authorize('ADMIN'), listAllPayments);
router.get('/:id/receipt',  authorize('ADMIN'), getReceiptUrl);
router.post('/:id/approve', authorize('ADMIN'), approvePayment);
router.post('/:id/reject',  authorize('ADMIN'), rejectPayment);

export default router;
