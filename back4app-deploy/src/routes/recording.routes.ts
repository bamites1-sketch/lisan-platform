import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import {
  uploadRecording,
  getMyRecordings,
  getRecordingsForTeacher,
  getAllRecordings,
  reviewRecording,
  getRecordingAudioUrl,
  deleteRecording,
} from '../controllers/recording.controller';

// ─── Multer memory storage — files go to R2, not disk ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory buffer for R2 upload
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student uploads a recording
router.post('/upload',   authorize('STUDENT'), upload.single('audio'), uploadRecording);

// Student views their own recordings
router.get('/mine',      authorize('STUDENT'), getMyRecordings);

// Get signed URL for audio playback (students, teachers, admins)
router.get('/:id/audio', authenticate, getRecordingAudioUrl);

// Teacher views recordings from their students
router.get('/teacher',   authorize('TEACHER'), getRecordingsForTeacher);

// Admin views all recordings
router.get('/admin',     authorize('ADMIN'),   getAllRecordings);

// Teacher/Admin reviews a recording
router.post('/:id/review', authorize('TEACHER', 'ADMIN'), reviewRecording);

// Admin deletes a recording
router.delete('/:id', authorize('ADMIN'), deleteRecording);

export default router;
