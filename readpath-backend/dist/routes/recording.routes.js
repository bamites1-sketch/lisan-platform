"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const recording_controller_1 = require("../controllers/recording.controller");
// ─── Multer memory storage — files go to R2, not disk ─────────────────────────
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Store in memory buffer for R2 upload
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Student uploads a recording
router.post('/upload', (0, auth_1.authorize)('STUDENT'), upload.single('audio'), recording_controller_1.uploadRecording);
// Student views their own recordings
router.get('/mine', (0, auth_1.authorize)('STUDENT'), recording_controller_1.getMyRecordings);
// Get signed URL for audio playback (students, teachers, admins)
router.get('/:id/audio', auth_1.authenticate, recording_controller_1.getRecordingAudioUrl);
// Teacher views recordings from their students
router.get('/teacher', (0, auth_1.authorize)('TEACHER'), recording_controller_1.getRecordingsForTeacher);
// Admin views all recordings
router.get('/admin', (0, auth_1.authorize)('ADMIN'), recording_controller_1.getAllRecordings);
// Teacher/Admin reviews a recording
router.post('/:id/review', (0, auth_1.authorize)('TEACHER', 'ADMIN'), recording_controller_1.reviewRecording);
// Admin deletes a recording
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), recording_controller_1.deleteRecording);
exports.default = router;
//# sourceMappingURL=recording.routes.js.map