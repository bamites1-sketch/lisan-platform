"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecording = exports.getRecordingAudioUrl = exports.getMyRecordings = exports.reviewRecording = exports.getAllRecordings = exports.getRecordingsForTeacher = exports.uploadRecording = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notification_controller_1 = require("./notification.controller");
const r2storage_1 = require("../lib/r2storage");
// Upload audio + save recording metadata
const uploadRecording = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { student: { include: { teacher: true } } } });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const file = req.file;
        const { passageTitle, passageId, durationSeconds, wpm, accuracy, cwpm, totalWords, pauseCount, hesitationCount, score } = req.body;
        // Upload to R2 if file provided
        let audioKey;
        if (file) {
            const result = await (0, r2storage_1.uploadToR2)(file, r2storage_1.FileCategory.RECORDING);
            audioKey = result.key;
        }
        const recording = await prisma_1.default.fluencyRecording.create({
            data: {
                studentId: user.student.id,
                teacherId: user.student.teacherId ?? undefined,
                passageId: passageId ?? undefined,
                passageTitle: passageTitle ?? 'Unknown Passage',
                audioUrl: audioKey, // Store R2 key instead of local path
                durationSeconds: parseInt(durationSeconds) || 0,
                wpm: parseInt(wpm) || 0,
                // accuracy: store 0 only when explicitly submitted; teacher review will set the real value
                // A score/accuracy of 0 with reviewed=false means "pending review"
                accuracy: accuracy !== undefined && accuracy !== null && accuracy !== '' ? parseFloat(accuracy) : 0,
                cwpm: parseInt(cwpm) || 0,
                totalWords: parseInt(totalWords) || 0,
                pauseCount: parseInt(pauseCount) || 0,
                hesitationCount: parseInt(hesitationCount) || 0,
                score: parseInt(score) || 0,
            }
        });
        // ── Notifications ─────────────────────────────────────────────────────────
        const studentName = `${user.student.firstName} ${user.student.lastName}`;
        const recScore = parseInt(score) || 0;
        const recTitle = passageTitle ?? 'Unknown Passage';
        const notifMeta = {
            studentName,
            passage: recTitle,
            recordingId: recording.id,
            score: String(recScore),
            grade: user.student.grade,
        };
        // Notify the student's teacher
        if (user.student.teacherId) {
            const teacherUser = await prisma_1.default.user.findFirst({
                where: { teacher: { id: user.student.teacherId } },
                select: { id: true },
            });
            if (teacherUser) {
                await (0, notification_controller_1.createNotification)({
                    recipientId: teacherUser.id,
                    role: 'TEACHER',
                    type: 'new_recording',
                    title: '🎤 New Reading Submitted',
                    message: `${studentName} submitted a recording of "${recTitle}". Score: ${recScore}/100.`,
                    icon: '🎤',
                    link: '/teacher/dashboard',
                    meta: notifMeta,
                });
            }
        }
        // Notify all admins
        await (0, notification_controller_1.broadcastToRole)('ADMIN', {
            type: 'new_recording',
            title: '🎤 New Fluency Recording',
            message: `${studentName} submitted "${recTitle}". Score: ${recScore}/100.`,
            icon: '🎤',
            link: '/admin/dashboard',
            meta: notifMeta,
        });
        res.status(201).json({ success: true, data: recording });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadRecording = uploadRecording;
// Teacher: get all recordings for their students
const getRecordingsForTeacher = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { teacher: true } });
        if (!user?.teacher)
            throw new errorHandler_1.AppError('Teacher not found', 404);
        // Get all students assigned to this teacher
        const students = await prisma_1.default.student.findMany({ where: { teacherId: user.teacher.id }, select: { id: true } });
        const studentIds = students.map(s => s.id);
        const recordings = await prisma_1.default.fluencyRecording.findMany({
            where: { studentId: { in: studentIds } },
            orderBy: { recordedAt: 'desc' },
        });
        // Attach student names
        const enriched = await Promise.all(recordings.map(async (r) => {
            const student = await prisma_1.default.student.findUnique({ where: { id: r.studentId }, select: { firstName: true, lastName: true, grade: true } });
            return { ...r, studentName: `${student?.firstName} ${student?.lastName}`, studentGrade: student?.grade };
        }));
        res.json({ success: true, data: enriched });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecordingsForTeacher = getRecordingsForTeacher;
// Admin: get all recordings
const getAllRecordings = async (req, res, next) => {
    try {
        const recordings = await prisma_1.default.fluencyRecording.findMany({ orderBy: { recordedAt: 'desc' } });
        const enriched = await Promise.all(recordings.map(async (r) => {
            const student = await prisma_1.default.student.findUnique({ where: { id: r.studentId }, select: { firstName: true, lastName: true, grade: true } });
            return { ...r, studentName: `${student?.firstName} ${student?.lastName}`, studentGrade: student?.grade };
        }));
        res.json({ success: true, data: enriched });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllRecordings = getAllRecordings;
// Teacher/Admin: save review (rating + note)
const reviewRecording = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { note, rating } = req.body;
        const recording = await prisma_1.default.fluencyRecording.update({
            where: { id },
            data: { reviewed: true, teacherNote: note, teacherRating: parseInt(rating), reviewedAt: new Date() }
        });
        // Notify the student — find their User.id via studentId
        const student = await prisma_1.default.student.findUnique({
            where: { id: recording.studentId },
            select: { userId: true, firstName: true, lastName: true },
        });
        if (student) {
            const stars = parseInt(String(rating)) || 0;
            const ratingLabel = ['', 'Needs significant support', 'Below expectations', 'Meeting expectations', 'Good progress', 'Excellent reading!'][stars] ?? '';
            await (0, notification_controller_1.createNotification)({
                recipientId: student.userId,
                role: 'STUDENT',
                type: 'teacher_feedback',
                title: '🎉 Your reading was reviewed!',
                message: `Your teacher reviewed your reading of "${recording.passageTitle}". Rating: ${stars}/5 — ${ratingLabel}`,
                icon: '🧑‍🏫',
                link: '/student/progress',
                meta: {
                    passage: recording.passageTitle,
                    score: String(recording.score),
                    rating: String(stars),
                    note: note?.trim() ?? '',
                    recordingId: recording.id,
                },
            });
        }
        res.json({ success: true, data: recording });
    }
    catch (error) {
        next(error);
    }
};
exports.reviewRecording = reviewRecording;
// Student: get their own recordings
const getMyRecordings = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { student: true } });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const recordings = await prisma_1.default.fluencyRecording.findMany({
            where: { studentId: user.student.id },
            orderBy: { recordedAt: 'desc' }
        });
        res.json({ success: true, data: recordings });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyRecordings = getMyRecordings;
// Get signed URL for audio playback
const getRecordingAudioUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { student: true, teacher: true } });
        const recording = await prisma_1.default.fluencyRecording.findUnique({ where: { id } });
        if (!recording)
            throw new errorHandler_1.AppError('Recording not found', 404);
        // Authorization: students can only access their own; teachers can access their students'; admins can access all
        const isStudent = user?.student && recording.studentId === user.student.id;
        const isTeacher = user?.teacher && recording.teacherId === user.teacher.id;
        const isAdmin = req.user.role === 'ADMIN';
        if (!isStudent && !isTeacher && !isAdmin) {
            throw new errorHandler_1.AppError('Not authorized to access this recording', 403);
        }
        if (!recording.audioUrl) {
            throw new errorHandler_1.AppError('No audio file available', 404);
        }
        // Generate signed URL (valid for 1 hour)
        const { getSignedDownloadUrl } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
        const signedUrl = await getSignedDownloadUrl(recording.audioUrl, 3600);
        res.json({ success: true, data: { url: signedUrl } });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecordingAudioUrl = getRecordingAudioUrl;
// Delete recording (and its R2 file)
const deleteRecording = async (req, res, next) => {
    try {
        const { id } = req.params;
        const recording = await prisma_1.default.fluencyRecording.findUnique({ where: { id } });
        if (!recording)
            throw new errorHandler_1.AppError('Recording not found', 404);
        // Delete from R2 if exists
        if (recording.audioUrl) {
            try {
                await (0, r2storage_1.deleteFromR2)(recording.audioUrl);
            }
            catch (err) {
                console.error('Failed to delete audio from R2:', err);
                // Continue with database deletion even if R2 deletion fails
            }
        }
        // Delete from database
        await prisma_1.default.fluencyRecording.delete({ where: { id } });
        res.json({ success: true, message: 'Recording deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRecording = deleteRecording;
//# sourceMappingURL=recording.controller.js.map