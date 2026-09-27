import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getStudentAssessments,
  getAssessmentForStudent,
  submitAssessmentRecording,
  getStudentAssessmentHistory,
  getAssessmentResult,
  startDiagnosticAssessment,
  getAssessmentQuestions,
  submitAssessmentResponse,
  completeAssessment,
  upload
} from '../controllers/assessment.controller';

const router = express.Router();
router.use(authenticate);
router.use(authorize('STUDENT'));

// Diagnostic assessment flow
router.post('/start', startDiagnosticAssessment);
router.get('/history/all', getStudentAssessmentHistory);
router.get('/:id/questions', getAssessmentQuestions);
router.post('/:id/responses', submitAssessmentResponse);
router.post('/:id/complete', completeAssessment);

// General student assessment endpoints — accessible to all assigned students
router.get('/', getStudentAssessments);
router.get('/:id', getAssessmentForStudent);
router.post('/:id/submit', upload.single('audio'), submitAssessmentRecording);
router.get('/:assessmentId/result/:submissionId', getAssessmentResult);

export default router;
