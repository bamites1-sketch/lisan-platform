import express from 'express';
import { authenticate, authorize, requireActive } from '../middleware/auth';
import {
  startPractice,
  submitPracticeResponse,
  completePractice,
  getPracticeHistory,
} from '../controllers/practice.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('STUDENT'));
router.use(requireActive);

router.post('/start',             startPractice);
router.post('/:id/responses',     submitPracticeResponse);
router.post('/:id/complete',      completePractice);
router.get('/history',            getPracticeHistory);

export default router;
