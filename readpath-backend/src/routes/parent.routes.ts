import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getChildrenProgress, getChildDetail } from '../controllers/parent.controller';
import { createParentFeedback, getMyParentFeedbacks } from '../controllers/feedback.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('PARENT'));

router.get('/children', getChildrenProgress);
router.get('/children/:id', getChildDetail);

// Parent Feedback
router.post('/feedback', createParentFeedback);
router.get('/feedback', getMyParentFeedbacks);

export default router;

