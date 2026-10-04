import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  saveAssessmentFeedback,
  getStudentAssessmentFeedbacks,
  getAdminAssessmentFeedbacks,
  deleteAssessmentFeedback
} from '../controllers/assessmentFeedback.controller';

const router = express.Router();

router.use(authenticate);

// Student views their own assessment feedbacks & recommendations
router.get('/student', authorize('STUDENT'), getStudentAssessmentFeedbacks);

// Admin endpoints
router.get('/admin', authorize('ADMIN'), getAdminAssessmentFeedbacks);
router.post('/admin', authorize('ADMIN'), saveAssessmentFeedback);
router.put('/admin/:id', authorize('ADMIN'), (req, res, next) => {
  req.body.id = req.params.id;
  return saveAssessmentFeedback(req, res, next);
});
router.delete('/admin/:id', authorize('ADMIN'), deleteAssessmentFeedback);

export default router;
