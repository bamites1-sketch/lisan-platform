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
exports.updateUserStatus = exports.updateAdminProfile = exports.getRecordingSubmissionAudioUrl = exports.reviewRecordingSubmission = exports.getAllRecordingSubmissions = exports.deleteUser = exports.createUser = exports.getParents = exports.getTeachers = exports.getStudents = exports.deleteClass = exports.assignClassStudents = exports.createClass = exports.getClasses = exports.deleteContent = exports.trackDownload = exports.getResourceDownloadUrl = exports.uploadPDFResource = exports.getPDFResources = exports.getAssessments = exports.getLessons = exports.getVocabulary = exports.getQuestions = exports.getPassages = exports.deleteAssignment = exports.updateAssignment = exports.createAssignment = exports.getAssignments = exports.getAnalytics = exports.updateContent = exports.createContent = exports.getAllUsers = exports.getDashboard = exports.upload = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notification_controller_1 = require("./notification.controller");
const multer_1 = __importDefault(require("multer"));
// ─── File Upload Configuration (Memory Storage for R2) ────────────────────────
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});
const getDashboard = async (req, res, next) => {
    try {
        const [totalStudents, totalTeachers, totalParents, completedAssessments, profiles] = await Promise.all([
            prisma_1.default.student.count(),
            prisma_1.default.teacher.count(),
            prisma_1.default.parent.count(),
            prisma_1.default.assessment.count({ where: { status: 'COMPLETED' } }),
            prisma_1.default.readingProfile.findMany({
                select: {
                    readinessScore: true,
                    phonemicAwarenessScore: true,
                    phonicsDecodingScore: true,
                    fluencyScore: true,
                    vocabularyScore: true,
                    comprehensionScore: true
                }
            })
        ]);
        const avgReadiness = profiles.length > 0
            ? Math.round(profiles.reduce((s, p) => s + p.readinessScore, 0) / profiles.length)
            : 0;
        res.json({
            success: true,
            data: {
                stats: {
                    totalStudents,
                    totalTeachers,
                    totalParents,
                    completedAssessments,
                    avgReadinessScore: avgReadiness
                },
                skillAverages: {
                    phonemicAwareness: Math.round(profiles.reduce((s, p) => s + p.phonemicAwarenessScore, 0) / (profiles.length || 1)),
                    phonicsDecoding: Math.round(profiles.reduce((s, p) => s + p.phonicsDecodingScore, 0) / (profiles.length || 1)),
                    fluency: Math.round(profiles.reduce((s, p) => s + p.fluencyScore, 0) / (profiles.length || 1)),
                    vocabulary: Math.round(profiles.reduce((s, p) => s + p.vocabularyScore, 0) / (profiles.length || 1)),
                    comprehension: Math.round(profiles.reduce((s, p) => s + p.comprehensionScore, 0) / (profiles.length || 1))
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
const getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma_1.default.user.findMany({
            include: {
                student: true,
                parent: true,
                teacher: true,
                admin: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: users.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role,
                createdAt: u.createdAt,
                profile: u.student || u.parent || u.teacher || u.admin
            }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const createContent = async (req, res, next) => {
    try {
        const { type, data } = req.body;
        let result;
        // If data has an id, it's an update operation
        if (data.id) {
            switch (type) {
                case 'passage':
                    result = await prisma_1.default.passage.update({
                        where: { id: data.id },
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                            updatedAt: new Date()
                        }
                    });
                    break;
                case 'question':
                    result = await prisma_1.default.question.update({
                        where: { id: data.id },
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                            updatedAt: new Date()
                        }
                    });
                    break;
                case 'vocabulary':
                    result = await prisma_1.default.vocabulary.update({
                        where: { id: data.id },
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                            updatedAt: new Date()
                        }
                    });
                    break;
                case 'lesson':
                    result = await prisma_1.default.lesson.update({
                        where: { id: data.id },
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                            updatedAt: new Date()
                        }
                    });
                    break;
                case 'assessment':
                    result = await prisma_1.default.assessment.update({
                        where: { id: data.id },
                        data: {
                            title: data.title,
                            description: data.description,
                            passage: data.passage || '',
                            grade: data.grade,
                            skillAreas: data.skillAreas || '[]',
                            instructions: data.instructions,
                            status: data.status || 'DRAFT',
                            updatedAt: new Date()
                        }
                    });
                    break;
                case 'pdf-resource':
                    result = await prisma_1.default.pDFResource.update({
                        where: { id: data.id },
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                            updatedAt: new Date()
                        }
                    });
                    break;
                default:
                    throw new errorHandler_1.AppError('Invalid content type', 400);
            }
        }
        else {
            // Create new content
            switch (type) {
                case 'passage':
                    result = await prisma_1.default.passage.create({
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                        }
                    });
                    break;
                case 'question':
                    result = await prisma_1.default.question.create({
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                        }
                    });
                    break;
                case 'vocabulary':
                    result = await prisma_1.default.vocabulary.create({
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                        }
                    });
                    break;
                case 'lesson':
                    result = await prisma_1.default.lesson.create({
                        data: {
                            ...data,
                            examples: data.examples || '[]',
                            demonstrationSteps: data.demonstrationSteps || '[]',
                            guidedPractice: data.guidedPractice || '[]',
                            independentPractice: data.independentPractice || '[]',
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                        }
                    });
                    break;
                case 'assessment':
                    result = await prisma_1.default.assessment.create({
                        data: {
                            title: data.title,
                            description: data.description || '',
                            passage: data.passage || '',
                            grade: data.grade,
                            skillAreas: data.skillAreas || '[]',
                            instructions: data.instructions || '',
                            status: data.status || 'DRAFT',
                            createdBy: req.user.userId
                        }
                    });
                    break;
                case 'pdf-resource':
                    result = await prisma_1.default.pDFResource.create({
                        data: {
                            ...data,
                            status: data.status || 'DRAFT',
                            assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
                            requiredPlan: data.requiredPlan || null,
                        }
                    });
                    break;
                default:
                    throw new errorHandler_1.AppError('Invalid content type', 400);
            }
        }
        // Send notification for newly published content
        if (data.status === 'PUBLISHED' && !data.id) {
            try {
                const contentTitle = data.title || data.word || 'New content';
                const gradeLabel = data.grade ? `Grade ${data.grade.replace('GRADE_', '')}` : 'all grades';
                // Notify students who can access this content
                const whereClause = {};
                // Filter by grade if assignedGrades is specified
                if (data.assignedGrades && data.assignedGrades.length > 0) {
                    whereClause.grade = { in: data.assignedGrades };
                }
                // Filter by plan if requiredPlan is specified
                if (data.requiredPlan) {
                    whereClause.user = {
                        status: data.requiredPlan === 'BASIC' ? { in: ['BASIC', 'PREMIUM'] }
                            : data.requiredPlan === 'PREMIUM' ? 'PREMIUM'
                                : data.requiredPlan === 'DIAGNOSTIC' ? { in: ['DIAGNOSTIC', 'BASIC', 'PREMIUM'] }
                                    : undefined
                    };
                }
                const targetStudents = await prisma_1.default.student.findMany({
                    where: whereClause,
                    select: { userId: true },
                });
                await Promise.all(targetStudents.map(s => (0, notification_controller_1.createNotification)({
                    recipientId: s.userId,
                    role: 'STUDENT',
                    type: 'new_content',
                    title: `📚 New ${type.charAt(0).toUpperCase() + type.slice(1)} Available`,
                    message: `"${contentTitle}" is now available for you to explore!`,
                    icon: type === 'passage' ? '📖'
                        : type === 'lesson' ? '📘'
                            : type === 'vocabulary' ? '📚'
                                : '📝',
                    link: '/student/dashboard',
                    meta: { contentType: type, contentTitle, grade: data.grade },
                })));
            }
            catch (notificationError) {
                // Don't fail the content creation if notifications fail
                console.error('Failed to send notifications:', notificationError);
            }
        }
        res.status(data.id ? 200 : 201).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.createContent = createContent;
// Reuse the content update logic while keeping PUT requests explicit and REST-friendly.
const updateContent = async (req, res, next) => {
    const { type, id } = req.params;
    const allowedFields = {
        lesson: ['skillArea', 'subskill', 'title', 'grade', 'difficulty', 'explanation', 'tips', 'order', 'examples', 'demonstrationSteps', 'guidedPractice', 'independentPractice', 'status', 'assignedGrades', 'requiredPlan'],
        passage: ['title', 'content', 'grade', 'difficulty', 'topic', 'wordCount', 'language', 'status', 'assignedGrades', 'requiredPlan'],
        question: ['passageId', 'skillArea', 'subskill', 'questionText', 'questionType', 'options', 'correctAnswer', 'explanation', 'grade', 'difficulty', 'status', 'assignedGrades', 'requiredPlan'],
        vocabulary: ['word', 'definition', 'exampleSentence', 'grade', 'difficulty', 'synonyms', 'antonyms', 'partOfSpeech', 'amharicTranslation', 'oromoTranslation', 'tigrinyaTranslation', 'status', 'assignedGrades', 'requiredPlan'],
    };
    const data = Object.fromEntries((allowedFields[type] ?? []).filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    req.body = { type, data: { ...data, id } };
    return (0, exports.createContent)(req, res, next);
};
exports.updateContent = updateContent;
const getAnalytics = async (req, res, next) => {
    try {
        const profiles = await prisma_1.default.readingProfile.findMany({
            include: {
                student: { select: { grade: true } }
            }
        });
        // Grade breakdown
        const gradeBreakdown = {};
        profiles.forEach(p => {
            const grade = p.student.grade;
            if (!gradeBreakdown[grade]) {
                gradeBreakdown[grade] = { count: 0, avgScore: 0 };
            }
            gradeBreakdown[grade].count++;
            gradeBreakdown[grade].avgScore += p.readinessScore;
        });
        Object.keys(gradeBreakdown).forEach(grade => {
            gradeBreakdown[grade].avgScore = Math.round(gradeBreakdown[grade].avgScore / gradeBreakdown[grade].count);
        });
        // Score distribution
        const distribution = {
            high: profiles.filter(p => p.readinessScore >= 75).length,
            medium: profiles.filter(p => p.readinessScore >= 60 && p.readinessScore < 75).length,
            low: profiles.filter(p => p.readinessScore < 60).length
        };
        res.json({
            success: true,
            data: {
                gradeBreakdown,
                distribution,
                totalAssessed: profiles.length
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
// ─── Content Assignments ───────────────────────────────────────────────────────
const getAssignments = async (req, res, next) => {
    try {
        const assignments = await prisma_1.default.contentAssignment.findMany({ orderBy: { assignedAt: 'desc' } });
        res.json({ success: true, data: assignments });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssignments = getAssignments;
const createAssignment = async (req, res, next) => {
    try {
        const { contentType, contentId, grade, note, dueDate } = req.body;
        const assignment = await prisma_1.default.contentAssignment.create({
            data: { contentType, contentId, grade, note, dueDate: dueDate ? new Date(dueDate) : undefined, assignedBy: 'Admin' }
        });
        // ── Fan-out notifications ──────────────────────────────────────────────────
        // Resolve content title
        let contentTitle = 'New content';
        try {
            const passage = contentType === 'passage' ? await prisma_1.default.passage.findUnique({ where: { id: contentId }, select: { title: true } }) : null;
            const lesson = contentType === 'lesson' ? await prisma_1.default.lesson.findUnique({ where: { id: contentId }, select: { title: true } }) : null;
            contentTitle = passage?.title ?? lesson?.title ?? contentTitle;
        }
        catch { /* keep default */ }
        const gradeLabel = grade === 'ALL' ? 'all grades' : `Grade ${grade.replace('GRADE_', '')}`;
        // Notify students in the target grade
        const targetStudents = await prisma_1.default.student.findMany({
            where: grade === 'ALL' ? {} : { grade },
            select: { userId: true },
        });
        await Promise.all(targetStudents.map(s => (0, notification_controller_1.createNotification)({
            recipientId: s.userId,
            role: 'STUDENT',
            type: 'new_content',
            title: '📋 New Content Assigned',
            message: `"${contentTitle}" has been assigned to you. Open your dashboard to start!`,
            icon: contentType === 'passage' ? '📖' : '🎓',
            link: '/student/dashboard',
            meta: { grade, contentTitle, contentType },
        })));
        // Notify all teachers
        await (0, notification_controller_1.broadcastToRole)('TEACHER', {
            type: 'new_content',
            title: 'Content Assigned to Students',
            message: `Admin assigned "${contentTitle}" to ${gradeLabel}.`,
            icon: '📋',
            link: '/teacher/dashboard',
            meta: { grade, contentTitle, contentType },
        });
        res.status(201).json({ success: true, data: assignment });
    }
    catch (error) {
        next(error);
    }
};
exports.createAssignment = createAssignment;
const updateAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const assignment = await prisma_1.default.contentAssignment.update({ where: { id }, data: req.body });
        res.json({ success: true, data: assignment });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAssignment = updateAssignment;
const deleteAssignment = async (req, res, next) => {
    try {
        await prisma_1.default.contentAssignment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAssignment = deleteAssignment;
// ─── Content CRUD ──────────────────────────────────────────────────────────────
const getPassages = async (_req, res, next) => {
    try {
        const passages = await prisma_1.default.passage.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: passages });
    }
    catch (error) {
        next(error);
    }
};
exports.getPassages = getPassages;
const getQuestions = async (_req, res, next) => {
    try {
        const questions = await prisma_1.default.question.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: questions });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuestions = getQuestions;
const getVocabulary = async (_req, res, next) => {
    try {
        const vocab = await prisma_1.default.vocabulary.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: vocab });
    }
    catch (error) {
        next(error);
    }
};
exports.getVocabulary = getVocabulary;
const getLessons = async (_req, res, next) => {
    try {
        const lessons = await prisma_1.default.lesson.findMany({ orderBy: { order: 'asc' } });
        res.json({ success: true, data: lessons });
    }
    catch (error) {
        next(error);
    }
};
exports.getLessons = getLessons;
const getAssessments = async (_req, res, next) => {
    try {
        const assessments = await prisma_1.default.assessment.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: assessments });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssessments = getAssessments;
const getPDFResources = async (_req, res, next) => {
    try {
        const resources = await prisma_1.default.pDFResource.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: resources });
    }
    catch (error) {
        next(error);
    }
};
exports.getPDFResources = getPDFResources;
const uploadPDFResource = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.AppError('No file uploaded', 400);
        }
        const { title, description, category, grade, difficulty, requiredPlan, assignedGrades } = req.body;
        // Upload to R2 if configured, otherwise store as data URI for 100% cloud persistence
        const { uploadToR2, FileCategory, isR2Configured } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
        let fileKey;
        if (isR2Configured()) {
            const result = await uploadToR2(req.file, FileCategory.RESOURCE);
            fileKey = result.key;
        }
        else {
            const mime = req.file.mimetype || 'application/pdf';
            const base64 = req.file.buffer.toString('base64');
            fileKey = `data:${mime};base64,${base64}`;
        }
        const targetGrade = grade || 'ALL';
        const targetAssignedGrades = assignedGrades || (targetGrade !== 'ALL' ? JSON.stringify([targetGrade]) : null);
        const resource = await prisma_1.default.pDFResource.create({
            data: {
                title: title || req.file.originalname.replace(/\.(pdf|ppt|pptx|xls|xlsx|doc|docx)$/i, ''),
                description: description || '',
                fileType: req.file.originalname.match(/\.([^.]+)$/)?.[1]?.toUpperCase() || 'PDF',
                fileName: req.file.originalname,
                fileUrl: fileKey,
                fileSize: req.file.size,
                category: category || 'RESOURCE',
                grade: targetGrade,
                difficulty: difficulty || 'MEDIUM',
                status: 'PUBLISHED', // Auto-publish for student access
                assignedGrades: targetAssignedGrades,
                requiredPlan: requiredPlan || null,
                uploadedBy: req.user.userId
            }
        });
        res.status(201).json({ success: true, data: resource });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadPDFResource = uploadPDFResource;
const getResourceDownloadUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resource = await prisma_1.default.pDFResource.findUnique({ where: { id } });
        if (!resource)
            throw new errorHandler_1.AppError('Resource not found', 404);
        if (!resource.fileUrl)
            throw new errorHandler_1.AppError('No file available', 404);
        // Track download
        await prisma_1.default.pDFResource.update({
            where: { id },
            data: { downloadCount: { increment: 1 } }
        });
        // If data URL or external web link, return directly
        if (resource.fileUrl.startsWith('data:') || resource.fileUrl.startsWith('http://') || resource.fileUrl.startsWith('https://')) {
            return res.json({
                success: true,
                data: {
                    url: resource.fileUrl,
                    downloadUrl: resource.fileUrl,
                    fileName: resource.fileName,
                    fileType: resource.fileType
                }
            });
        }
        // Generate signed URL if R2 is configured
        try {
            const { getSignedDownloadUrl, isR2Configured } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
            if (isR2Configured()) {
                const signedUrl = await getSignedDownloadUrl(resource.fileUrl, 3600);
                return res.json({
                    success: true,
                    data: {
                        url: signedUrl,
                        downloadUrl: signedUrl,
                        fileName: resource.fileName,
                        fileType: resource.fileType
                    }
                });
            }
        }
        catch (e) {
            console.warn('[getResourceDownloadUrl] R2 error:', e);
        }
        // Local storage fallback
        const { getLocalUrl } = await Promise.resolve().then(() => __importStar(require('../lib/localStorage')));
        const localUrl = getLocalUrl(resource.fileUrl);
        res.json({
            success: true,
            data: {
                url: localUrl || resource.fileUrl,
                downloadUrl: localUrl || resource.fileUrl,
                fileName: resource.fileName,
                fileType: resource.fileType
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getResourceDownloadUrl = getResourceDownloadUrl;
const trackDownload = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma_1.default.pDFResource.update({
            where: { id },
            data: {
                downloadCount: {
                    increment: 1
                }
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.trackDownload = trackDownload;
const deleteContent = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        if (type === 'passage') {
            // Delete child records first (SQLite does not enforce FK cascades on all relations)
            await prisma_1.default.question.updateMany({ where: { passageId: id }, data: { passageId: null } });
            await prisma_1.default.fluencyAssessment.deleteMany({ where: { passageId: id } });
            await prisma_1.default.passage.delete({ where: { id } });
        }
        if (type === 'question') {
            // Remove responses referencing this question before deleting
            await prisma_1.default.assessmentResponse.deleteMany({ where: { questionId: id } });
            await prisma_1.default.practiceResponse.deleteMany({ where: { questionId: id } });
            await prisma_1.default.question.delete({ where: { id } });
        }
        if (type === 'vocabulary')
            await prisma_1.default.vocabulary.delete({ where: { id } });
        if (type === 'lesson') {
            // Unlink learning activities before deleting lesson
            await prisma_1.default.learningActivity.updateMany({ where: { lessonId: id }, data: { lessonId: null } });
            await prisma_1.default.lesson.delete({ where: { id } });
        }
        if (type === 'assessment') {
            await prisma_1.default.assessment.delete({ where: { id } });
        }
        if (type === 'pdf-resource') {
            // Get the resource to delete from R2
            const resource = await prisma_1.default.pDFResource.findUnique({ where: { id } });
            if (resource && resource.fileUrl) {
                try {
                    const { deleteFromR2 } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
                    await deleteFromR2(resource.fileUrl);
                }
                catch (err) {
                    console.error('Failed to delete resource from R2:', err);
                    // Continue with database deletion
                }
            }
            await prisma_1.default.pDFResource.delete({ where: { id } });
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteContent = deleteContent;
const getClasses = async (_req, res, next) => {
    try {
        const classes = await prisma_1.default.classGroup.findMany({ include: { memberships: { include: { student: true } } }, orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: classes });
    }
    catch (error) {
        next(error);
    }
};
exports.getClasses = getClasses;
const createClass = async (req, res, next) => {
    try {
        const { name, grade, description, onlineLink } = req.body;
        if (!name?.trim() || !grade)
            throw new errorHandler_1.AppError('Class name and grade are required', 400);
        const classGroup = await prisma_1.default.classGroup.create({ data: { name: name.trim(), grade, description: description?.trim() || null, onlineLink: onlineLink?.trim() || null } });
        res.status(201).json({ success: true, data: classGroup });
    }
    catch (error) {
        next(error);
    }
};
exports.createClass = createClass;
const assignClassStudents = async (req, res, next) => {
    try {
        const { studentIds } = req.body;
        if (!Array.isArray(studentIds) || studentIds.length === 0)
            throw new errorHandler_1.AppError('Student IDs are required', 400);
        await Promise.all(studentIds.map(studentId => prisma_1.default.classMembership.upsert({
            where: { classId_studentId: { classId: req.params.id, studentId } },
            update: {},
            create: { classId: req.params.id, studentId },
        })));
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.assignClassStudents = assignClassStudents;
const deleteClass = async (req, res, next) => {
    try {
        await prisma_1.default.classGroup.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteClass = deleteClass;
// ─── Student/Teacher/Parent management ─────────────────────────────────────────
const getStudents = async (_req, res, next) => {
    try {
        const students = await prisma_1.default.student.findMany({
            orderBy: { createdAt: 'desc' },
            include: { readingProfiles: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        res.json({ success: true, data: students.map(s => ({
                ...s,
                score: s.readingProfiles[0]?.readinessScore ?? 0,
                status: (s.readingProfiles[0]?.readinessScore ?? 0) >= 75 ? 'READY' : (s.readingProfiles[0]?.readinessScore ?? 0) >= 60 ? 'DEVELOPING' : s.readingProfiles.length ? 'NEEDS_SUPPORT' : 'NOT_ASSESSED',
            })) });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudents = getStudents;
const getTeachers = async (_req, res, next) => {
    try {
        const teachers = await prisma_1.default.teacher.findMany({ orderBy: { createdAt: 'desc' }, include: { students: { select: { id: true } } } });
        res.json({ success: true, data: teachers });
    }
    catch (error) {
        next(error);
    }
};
exports.getTeachers = getTeachers;
const getParents = async (_req, res, next) => {
    try {
        const parents = await prisma_1.default.parent.findMany({ orderBy: { createdAt: 'desc' }, include: { children: { select: { id: true } } } });
        res.json({ success: true, data: parents });
    }
    catch (error) {
        next(error);
    }
};
exports.getParents = getParents;
const createUser = async (req, res, next) => {
    try {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const { email, firstName, lastName, role, grade, password: rawPassword } = req.body;
        if (!email || !firstName || !lastName || !role) {
            throw new errorHandler_1.AppError('email, firstName, lastName, and role are required.', 400);
        }
        const VALID_ROLES = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'];
        if (!VALID_ROLES.includes(role))
            throw new errorHandler_1.AppError('Invalid role.', 400);
        const trimmedEmail = String(email).trim().toLowerCase();
        const existing = await prisma_1.default.user.findUnique({ where: { email: trimmedEmail } });
        if (existing)
            throw new errorHandler_1.AppError('A user with this email already exists.', 400);
        // Use a provided password or a strong default; always hash with cost 12
        const plainPassword = rawPassword
            ? String(rawPassword)
            : `ReadPath@${Math.random().toString(36).slice(2, 10)}!`;
        const hashedPassword = await bcrypt.default.hash(plainPassword, 12);
        const user = await prisma_1.default.user.create({
            data: {
                email: trimmedEmail,
                password: hashedPassword,
                role,
                ...(role === 'STUDENT' && { student: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim(), grade } } }),
                ...(role === 'TEACHER' && { teacher: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
                ...(role === 'PARENT' && { parent: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
                ...(role === 'ADMIN' && { admin: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
            },
            include: { student: true, teacher: true, parent: true, admin: true },
        });
        // Return temporary password only once so the admin can communicate it
        res.status(201).json({
            success: true,
            data: user,
            ...(rawPassword ? {} : { temporaryPassword: plainPassword }),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.userId;
        // Prevent self-deletion
        const requesterUser = await prisma_1.default.user.findUnique({ where: { id: requesterId }, select: { id: true } });
        if (requesterUser?.id === id) {
            throw new errorHandler_1.AppError('You cannot delete your own account.', 403);
        }
        const target = await prisma_1.default.user.findUnique({ where: { id }, select: { role: true } });
        if (!target)
            throw new errorHandler_1.AppError('User not found.', 404);
        // Prevent deleting the last admin
        if (target.role === 'ADMIN') {
            const adminCount = await prisma_1.default.admin.count();
            if (adminCount <= 1) {
                throw new errorHandler_1.AppError('Cannot delete the last admin account.', 403);
            }
        }
        await prisma_1.default.user.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
// Get all assessment submissions with audio recordings for admin review
const getAllRecordingSubmissions = async (req, res, next) => {
    try {
        // Get all assessment submissions that have audio files
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: {
                audioUrl: { not: null }
            },
            include: {
                assessment: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        grade: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
        // Transform submissions to match the expected format for recordings
        const recordings = submissions.map(submission => ({
            id: submission.id,
            studentId: submission.student.id,
            studentName: `${submission.student.firstName} ${submission.student.lastName}`,
            studentGrade: submission.student.grade,
            passageTitle: submission.assessment.title,
            audioUrl: submission.audioUrl,
            durationSeconds: submission.duration || 0,
            wpm: 0, // Not calculated for assessment submissions
            accuracy: 0, // Will be set during review
            cwpm: 0,
            totalWords: 0,
            pauseCount: 0,
            hesitationCount: 0,
            score: submission.overallScore || 0,
            reviewed: submission.status === 'REVIEWED',
            teacherNote: submission.feedback || '',
            teacherRating: 3, // Default rating
            reviewedAt: submission.reviewedAt?.toISOString() || null,
            recordedAt: submission.submittedAt?.toISOString() || submission.createdAt.toISOString(),
            // Add type to distinguish from fluency recordings
            type: 'assessment'
        }));
        res.json({
            success: true,
            data: recordings
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllRecordingSubmissions = getAllRecordingSubmissions;
// Review assessment submission (for recordings shown in admin panel)
const reviewRecordingSubmission = async (req, res, next) => {
    try {
        const { id } = req.params; // submission ID
        const { note, rating } = req.body;
        // Update the assessment submission with admin feedback
        const updatedSubmission = await prisma_1.default.assessmentSubmission.update({
            where: { id },
            data: {
                status: 'REVIEWED',
                feedback: note || null,
                reviewedAt: new Date(),
                reviewedBy: req.user.userId
            },
            include: {
                student: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true
                    }
                },
                assessment: {
                    select: {
                        title: true
                    }
                }
            }
        });
        // Notify the student about the review
        if (updatedSubmission.student) {
            const stars = parseInt(String(rating)) || 0;
            const ratingLabel = ['', 'Needs significant support', 'Below expectations', 'Meeting expectations', 'Good progress', 'Excellent reading!'][stars] ?? '';
            await (0, notification_controller_1.createNotification)({
                recipientId: updatedSubmission.student.userId,
                role: 'STUDENT',
                type: 'teacher_feedback',
                title: '🎉 Your assessment was reviewed!',
                message: `Your assessment "${updatedSubmission.assessment.title}" was reviewed by an admin. ${ratingLabel}`,
                icon: '🧑‍🏫',
                link: '/student/progress',
                meta: {
                    assessmentTitle: updatedSubmission.assessment.title,
                    rating: String(stars),
                    note: note?.trim() || '',
                    submissionId: updatedSubmission.id,
                },
            });
        }
        res.json({
            success: true,
            data: {
                id: updatedSubmission.id,
                reviewed: true,
                teacherNote: note || '',
                teacherRating: rating || 3,
                reviewedAt: updatedSubmission.reviewedAt?.toISOString() || null
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reviewRecordingSubmission = reviewRecordingSubmission;
// Get signed or direct URL for assessment submission audio
const getRecordingSubmissionAudioUrl = async (req, res, next) => {
    try {
        const { id } = req.params; // submission ID
        const submission = await prisma_1.default.assessmentSubmission.findUnique({
            where: { id },
            select: { audioUrl: true }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Submission not found', 404);
        }
        if (!submission.audioUrl) {
            throw new errorHandler_1.AppError('No audio file available', 404);
        }
        // Direct playback for data URIs or public HTTP links
        if (submission.audioUrl.startsWith('data:') || submission.audioUrl.startsWith('http://') || submission.audioUrl.startsWith('https://')) {
            return res.json({
                success: true,
                data: { url: submission.audioUrl }
            });
        }
        // Generate signed URL if R2 configured
        try {
            const { getSignedDownloadUrl, isR2Configured } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
            if (isR2Configured()) {
                const signedUrl = await getSignedDownloadUrl(submission.audioUrl, 3600);
                return res.json({
                    success: true,
                    data: { url: signedUrl }
                });
            }
        }
        catch (e) {
            console.warn('[getRecordingSubmissionAudioUrl] R2 error:', e);
        }
        // Fallback to local storage URL
        const { getLocalUrl } = await Promise.resolve().then(() => __importStar(require('../lib/localStorage')));
        const localUrl = getLocalUrl(submission.audioUrl);
        res.json({
            success: true,
            data: { url: localUrl || submission.audioUrl }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecordingSubmissionAudioUrl = getRecordingSubmissionAudioUrl;
// ─── Admin Profile Management ────────────────────────────────────────────────
const updateAdminProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user.userId;
        if (phone !== undefined) {
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { phone: String(phone).trim() }
            });
        }
        if (firstName || lastName) {
            await prisma_1.default.admin.upsert({
                where: { userId },
                update: {
                    firstName: firstName ? String(firstName).trim() : undefined,
                    lastName: lastName ? String(lastName).trim() : undefined,
                },
                create: {
                    userId,
                    firstName: String(firstName || 'Admin').trim(),
                    lastName: String(lastName || 'User').trim()
                }
            });
        }
        const updatedUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { admin: true }
        });
        res.json({
            success: true,
            message: 'Admin profile updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAdminProfile = updateAdminProfile;
// ─── User Status Management (Activate / Suspend) ─────────────────────────────
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['PENDING', 'PAYMENT_PENDING', 'ACTIVE', 'SUSPENDED'].includes(status)) {
            throw new errorHandler_1.AppError('Invalid status', 400);
        }
        const updated = await prisma_1.default.user.update({
            where: { id },
            data: { status },
            include: { student: true, teacher: true, parent: true }
        });
        res.json({
            success: true,
            message: `User status updated to ${status}`,
            data: updated
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserStatus = updateUserStatus;
//# sourceMappingURL=admin.controller.js.map