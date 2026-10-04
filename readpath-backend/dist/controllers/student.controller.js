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
exports.getStudentResourceDownloadUrl = exports.getStudentResources = exports.getContentItem = exports.getStudentContent = exports.getStudentClasses = exports.getStudentAssignments = exports.getProgressLogs = exports.updateProfile = exports.getDashboard = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        // Get student with latest profile and learning plan
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                student: {
                    include: {
                        readingProfiles: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: {
                                learningPlan: {
                                    include: {
                                        weeks: {
                                            include: {
                                                activities: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        badges: {
                            orderBy: { earnedAt: 'desc' }
                        },
                        assessments: {
                            where: { status: { in: ['SUBMITTED', 'REVIEWED'] } },
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const student = user.student;
        const latestProfile = student.readingProfiles[0];
        const latestAssessment = student.assessments[0];
        // Calculate dynamic target grade
        const currentGradeNum = parseInt(student.grade.replace('GRADE_', ''));
        const targetGradeNum = Math.min(currentGradeNum + 1, 12);
        const targetGrade = targetGradeNum === 12 ? 'Senior / College' : `Grade ${targetGradeNum}`;
        const skillScores = latestProfile ? {
            phonemicAwareness: latestProfile.phonemicAwarenessScore,
            phonicsDecoding: latestProfile.phonicsDecodingScore,
            fluency: latestProfile.fluencyScore,
            vocabulary: latestProfile.vocabularyScore,
            comprehension: latestProfile.comprehensionScore,
        } : null;
        const [assignmentRows, recentActivity, pendingAssessments] = await Promise.all([
            prisma_1.default.contentAssignment.findMany({
                where: { status: { not: 'archived' }, OR: [{ grade: student.grade }, { grade: 'ALL' }] },
                orderBy: { assignedAt: 'desc' },
                take: 5,
            }),
            prisma_1.default.progressLog.findMany({
                where: { studentId: student.id },
                orderBy: { date: 'desc' },
                take: 5,
            }),
            prisma_1.default.assessmentSubmission.findMany({
                where: { studentId: student.id, status: 'IN_PROGRESS' },
                include: { assessment: true },
                take: 3,
                orderBy: { createdAt: 'desc' }
            })
        ]);
        const resolvedContent = await Promise.all(assignmentRows.map(async (assignment) => {
            const content = assignment.contentType === 'passage'
                ? await prisma_1.default.passage.findUnique({ where: { id: assignment.contentId }, select: { title: true } })
                : await prisma_1.default.lesson.findUnique({ where: { id: assignment.contentId }, select: { title: true } });
            return { ...assignment, contentTitle: content?.title ?? 'Assigned learning activity' };
        }));
        const resolvedAssessments = pendingAssessments.map(sub => ({
            id: sub.id,
            contentType: 'assessment',
            contentId: sub.assessmentId,
            grade: sub.assessment.grade,
            assignedAt: sub.createdAt,
            status: 'active',
            contentTitle: sub.assessment.title
        }));
        const assignments = [...resolvedAssessments, ...resolvedContent];
        res.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    grade: student.grade,
                    xp: student.xp,
                    level: student.level,
                    streakDays: student.streakDays
                },
                readinessScore: latestProfile?.readinessScore || null,
                targetGrade,
                skillScores,
                latestProfile: latestProfile ? {
                    id: latestProfile.id,
                    readinessScore: latestProfile.readinessScore,
                    strengths: latestProfile.strengths,
                    weaknesses: latestProfile.weaknesses,
                    priorities: latestProfile.priorities
                } : null,
                learningPlan: latestProfile?.learningPlan || null,
                badges: student.badges,
                hasCompletedAssessment: !!latestProfile || !!latestAssessment,
                assignments,
                recentActivity,
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const updated = await prisma_1.default.student.update({
            where: { id: user.student.id },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName })
            }
        });
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updated
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const getProgressLogs = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { student: true } });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const logs = await prisma_1.default.progressLog.findMany({
            where: { studentId: user.student.id },
            orderBy: { date: 'asc' }
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        next(error);
    }
};
exports.getProgressLogs = getProgressLogs;
// ─── Assignments (grade-filtered for the logged-in student) ──────────────────
const getStudentAssignments = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, include: { student: true } });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const grade = user.student.grade; // e.g. "GRADE_6"
        // 1. Fetch content assignments for student's grade or ALL grades
        const contentAssignments = await prisma_1.default.contentAssignment.findMany({
            where: {
                status: { not: 'archived' },
                OR: [{ grade }, { grade: 'ALL' }],
            },
            orderBy: { assignedAt: 'desc' },
        });
        // 2. Auto-sync published assessments matching student grade or ALL
        const publishedGradeAssessments = await prisma_1.default.assessment.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [{ grade }, { grade: 'ALL' }]
            }
        });
        for (const asm of publishedGradeAssessments) {
            const existing = await prisma_1.default.assessmentSubmission.findFirst({
                where: { assessmentId: asm.id, studentId: user.student.id }
            });
            if (!existing) {
                await prisma_1.default.assessmentSubmission.create({
                    data: {
                        assessmentId: asm.id,
                        studentId: user.student.id,
                        status: 'IN_PROGRESS'
                    }
                });
            }
        }
        // 3. Fetch assigned assessment submissions
        const assignedAssessments = await prisma_1.default.assessmentSubmission.findMany({
            where: {
                studentId: user.student.id,
                status: { in: ['IN_PROGRESS', 'SUBMITTED', 'REVIEWED'] }
            },
            include: {
                assessment: true
            },
            orderBy: { createdAt: 'desc' }
        });
        // 4. Resolve details for content assignments
        const resolvedContentAssignments = await Promise.all(contentAssignments.map(async (item) => {
            let contentDetails = null;
            let title = 'Assigned Learning Activity';
            if (item.contentType === 'passage') {
                const passage = await prisma_1.default.passage.findUnique({
                    where: { id: item.contentId },
                    select: { id: true, title: true, topic: true, difficulty: true, wordCount: true, grade: true, content: true }
                });
                if (passage) {
                    title = passage.title;
                    contentDetails = {
                        title: passage.title,
                        topic: passage.topic,
                        difficulty: passage.difficulty,
                        wordCount: passage.wordCount,
                        grade: passage.grade,
                        preview: passage.content.slice(0, 140) + '...'
                    };
                }
            }
            else if (item.contentType === 'lesson') {
                const lesson = await prisma_1.default.lesson.findUnique({
                    where: { id: item.contentId },
                    select: { id: true, title: true, skillArea: true, subskill: true, difficulty: true, grade: true, explanation: true }
                });
                if (lesson) {
                    title = lesson.title;
                    contentDetails = {
                        title: lesson.title,
                        skillArea: lesson.skillArea,
                        subskill: lesson.subskill,
                        difficulty: lesson.difficulty,
                        grade: lesson.grade,
                        preview: lesson.explanation.slice(0, 140) + '...'
                    };
                }
            }
            return {
                id: item.id,
                contentType: item.contentType,
                contentId: item.contentId,
                title,
                grade: item.grade,
                assignedAt: item.assignedAt.toISOString(),
                dueDate: item.dueDate ? item.dueDate.toISOString() : null,
                note: item.note,
                status: item.status,
                assignedBy: item.assignedBy,
                details: contentDetails
            };
        }));
        // 5. Format assessment items with complete valuation metadata
        const formattedAssessments = assignedAssessments.map(sub => {
            let skillAreasParsed = [];
            try {
                skillAreasParsed = JSON.parse(sub.assessment.skillAreas || '[]');
            }
            catch {
                skillAreasParsed = [];
            }
            return {
                id: `assessment-${sub.id}`,
                contentType: 'assessment',
                contentId: sub.assessmentId,
                submissionId: sub.id,
                title: sub.assessment.title,
                grade: sub.assessment.grade,
                assignedAt: sub.createdAt.toISOString(),
                dueDate: null,
                note: sub.assessment.description || sub.assessment.instructions,
                status: sub.status === 'IN_PROGRESS' ? 'active' : 'completed',
                submissionStatus: sub.status,
                overallScore: sub.overallScore,
                reviewedAt: sub.reviewedAt ? sub.reviewedAt.toISOString() : null,
                feedback: sub.feedback,
                details: {
                    title: sub.assessment.title,
                    passage: sub.assessment.passage,
                    skillAreas: skillAreasParsed,
                    instructions: sub.assessment.instructions,
                    status: sub.status,
                    overallScore: sub.overallScore,
                    fluencyScore: sub.fluencyScore,
                    accuracyScore: sub.accuracyScore,
                    phonicsScore: sub.phonicsDecodingScore,
                    comprehensionScore: sub.comprehensionScore,
                    strengths: sub.strengths,
                    weaknesses: sub.weaknesses,
                    recommendations: sub.recommendations,
                    recommendedNextLevel: sub.recommendedNextLevel,
                    feedback: sub.feedback
                }
            };
        });
        res.json({
            success: true,
            data: [...resolvedContentAssignments, ...formattedAssessments]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentAssignments = getStudentAssignments;
const getStudentClasses = async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.userId }, include: { student: true } });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const classes = await prisma_1.default.classGroup.findMany({ where: { memberships: { some: { studentId: user.student.id } } }, include: { memberships: { include: { student: { select: { firstName: true, lastName: true } } } } }, orderBy: { name: 'asc' } });
        res.json({ success: true, data: classes });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentClasses = getStudentClasses;
// ─── Student Content (filtered by published status, grade, and payment plan) ─────
const getStudentContent = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const studentGrade = user.student.grade;
        const approvedPayment = await prisma_1.default.paymentSubmission.findFirst({
            where: { userId, status: 'APPROVED' },
            orderBy: { reviewedAt: 'desc' },
            select: { package: true },
        });
        const packageName = approvedPayment?.package.toUpperCase() ?? 'BASIC';
        const userPlan = packageName.includes('PREMIUM') ? 'PREMIUM' : packageName.includes('DIAGNOSTIC') ? 'DIAGNOSTIC' : 'BASIC';
        // Fetch all content types in parallel with individual filters
        const [lessons, passages, questions, vocabulary, pdfResources] = await Promise.all([
            prisma_1.default.lesson.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { requiredPlan: null },
                        { requiredPlan: userPlan },
                        ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
                    ],
                    AND: [
                        {
                            OR: [
                                { assignedGrades: null },
                                { assignedGrades: { contains: studentGrade } },
                                { grade: studentGrade }
                            ]
                        }
                    ]
                },
                orderBy: { order: 'asc' }
            }),
            prisma_1.default.passage.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { requiredPlan: null },
                        { requiredPlan: userPlan },
                        ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
                    ],
                    AND: [
                        {
                            OR: [
                                { assignedGrades: null },
                                { assignedGrades: { contains: studentGrade } },
                                { grade: studentGrade }
                            ]
                        }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.question.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { requiredPlan: null },
                        { requiredPlan: userPlan },
                        ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
                    ],
                    AND: [
                        {
                            OR: [
                                { assignedGrades: null },
                                { assignedGrades: { contains: studentGrade } },
                                { grade: studentGrade }
                            ]
                        }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.vocabulary.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { requiredPlan: null },
                        { requiredPlan: userPlan },
                        ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
                    ],
                    AND: [
                        {
                            OR: [
                                { assignedGrades: null },
                                { assignedGrades: { contains: studentGrade } },
                                { grade: studentGrade }
                            ]
                        }
                    ]
                },
                orderBy: { word: 'asc' }
            }),
            prisma_1.default.pDFResource.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { requiredPlan: null },
                        { requiredPlan: userPlan },
                        ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
                    ],
                    AND: [
                        {
                            OR: [
                                { assignedGrades: null },
                                { assignedGrades: { contains: studentGrade } },
                                { grade: studentGrade }
                            ]
                        }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);
        res.json({
            success: true,
            data: {
                lessons,
                passages,
                questions,
                vocabulary,
                pdfResources,
                meta: {
                    studentGrade,
                    userPlan,
                    totalContent: lessons.length + passages.length + questions.length + vocabulary.length + pdfResources.length
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentContent = getStudentContent;
// ─── Get specific content by type and ID (with access control) ───────────────
const getContentItem = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { type, id } = req.params;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user?.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const studentGrade = user.student.grade;
        const userPlan = user.status;
        let content = null;
        // Fetch content based on type
        switch (type) {
            case 'lesson':
                content = await prisma_1.default.lesson.findUnique({ where: { id } });
                break;
            case 'passage':
                content = await prisma_1.default.passage.findUnique({ where: { id } });
                break;
            case 'question':
                content = await prisma_1.default.question.findUnique({ where: { id } });
                break;
            case 'vocabulary':
                content = await prisma_1.default.vocabulary.findUnique({ where: { id } });
                break;
            default:
                throw new errorHandler_1.AppError('Invalid content type', 400);
        }
        if (!content) {
            throw new errorHandler_1.AppError('Content not found', 404);
        }
        // Check access permissions
        const hasAccess = (content.status === 'PUBLISHED' &&
            (!content.requiredPlan ||
                content.requiredPlan === userPlan ||
                (userPlan === 'PREMIUM' && content.requiredPlan === 'BASIC') ||
                (user.status !== 'PENDING' && content.requiredPlan === 'DIAGNOSTIC')) &&
            (!content.assignedGrades ||
                content.assignedGrades.includes(studentGrade)));
        if (!hasAccess) {
            throw new errorHandler_1.AppError('Access denied to this content', 403);
        }
        res.json({
            success: true,
            data: content
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getContentItem = getContentItem;
// ─── Student Resources (Study Materials, Worksheets, Guides) ────────────────
const getStudentResources = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        const studentGrade = user?.student?.grade || '';
        const resources = await prisma_1.default.pDFResource.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { grade: 'ALL' },
                    { grade: studentGrade },
                    { assignedGrades: null },
                    { assignedGrades: { contains: studentGrade } },
                    { assignedGrades: { contains: 'ALL' } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: resources });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentResources = getStudentResources;
const getStudentResourceDownloadUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resource = await prisma_1.default.pDFResource.findUnique({ where: { id } });
        if (!resource)
            throw new errorHandler_1.AppError('Resource not found', 404);
        if (!resource.fileUrl)
            throw new errorHandler_1.AppError('No file available', 404);
        await prisma_1.default.pDFResource.update({
            where: { id },
            data: { downloadCount: { increment: 1 } }
        });
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
            console.warn('[getStudentResourceDownloadUrl] R2 error:', e);
        }
        const { getLocalUrl } = await Promise.resolve().then(() => __importStar(require('../lib/localStorage')));
        const localUrl = getLocalUrl(resource.fileUrl);
        return res.json({
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
exports.getStudentResourceDownloadUrl = getStudentResourceDownloadUrl;
//# sourceMappingURL=student.controller.js.map