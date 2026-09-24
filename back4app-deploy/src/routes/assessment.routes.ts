import express from 'express';
import { authenticate, authorize, requireActive } from '../middleware/auth';
import {
  getStudentAssessments,
  getAssessmentForStudent,
  submitAssessmentRecording,
  getStudentAssessmentHistory,
  getAssessmentResult,
  upload
} from '../controllers/assessment.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('STUDENT'));
router.use(requireActive);   // assessments require an active account

// Student assessment endpoints
router.get('/', getStudentAssessments);
router.get('/:id', getAssessmentForStudent);
router.post('/:id/submit', upload.single('audio'), submitAssessmentRecording);
router.get('/:assessmentId/result/:submissionId', getAssessmentResult);
router.get('/history/all', getStudentAssessmentHistory);

export default router;
