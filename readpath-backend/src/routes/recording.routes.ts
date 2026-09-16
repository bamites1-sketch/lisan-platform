import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import {
  uploadRecording,
  getRecordingsForTeacher,
  getAllRecordings,
  reviewRecording,
  getMyRecordings,
} from '../controllers/recording.controller';
import { AppError } from '../middleware/errorHandler';

// ─── Upload directory ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/recordings');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── Allowed audio MIME types ─────────────────────────────────────────────────
const ALLOWED_AUDIO_MIMES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/flac',
]);

const ALLOWED_AUDIO_EXTS = new Set(['.webm', '.ogg', '.mp3', '.mp4', '.wav', '.aac', '.flac', '.m4a']);

// ─── Multer storage — randomise filename to prevent path traversal ────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => {
    // Random hex name + safe extension only
    const rand = require('crypto').randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${rand}.webm`);
  },
});

const fileFilter = (
  _req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_AUDIO_MIMES.has(mime) || ALLOWED_AUDIO_EXTS.has(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only audio files are allowed.', 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB — generous for a reading recording
    files: 1,                   // single file per request
  },
});

// ─── Router ───────────────────────────────────────────────────────────────────
const router = express.Router();

router.use(authenticate);

// Student uploads a recording
router.post('/upload',   authorize('STUDENT'), upload.single('audio'), uploadRecording);

// Student views their own recordings
router.get('/mine',      authorize('STUDENT'), getMyRecordings);

// Teacher views their students' recordings
router.get('/teacher',   authorize('TEACHER'), getRecordingsForTeacher);

// Admin views all recordings
router.get('/admin',     authorize('ADMIN'),   getAllRecordings);

// Teacher or Admin saves a review
router.post('/:id/review', authorize('TEACHER', 'ADMIN'), reviewRecording);

export default router;
