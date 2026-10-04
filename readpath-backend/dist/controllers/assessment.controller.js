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
exports.getAssessmentResult = exports.getStudentAssessmentHistory = exports.scoreSubmission = exports.getSubmissionForReview = exports.getSubmissionsForReview = exports.submitAssessmentRecording = exports.getAssessmentForStudent = exports.getStudentAssessments = exports.completeAssessment = exports.submitAssessmentResponse = exports.getAssessmentQuestions = exports.startDiagnosticAssessment = exports.assignAssessment = exports.getGradesForAssignment = exports.getTeachersForAssignment = exports.getStudentsForAssignment = exports.deleteAssessment = exports.updateAssessment = exports.getAssessment = exports.getAllAssessments = exports.createAssessment = exports.upload = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notification_controller_1 = require("./notification.controller");
const multer_1 = __importDefault(require("multer"));
const diagnostic_service_1 = require("../services/diagnostic.service");
// Configure multer for audio uploads (memory storage for R2)
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // Technical storage safeguard; no short recording duration limit.
    }
});
// ============================================================================
// ADMIN ENDPOINTS - Create and Manage Assessments
// ============================================================================
const createAssessment = async (req, res, next) => {
    try {
        const { title, description, passage, grade, skillAreas, instructions } = req.body;
        const userId = req.user.userId;
        // Validate required fields
        if (!title || !passage || !grade) {
            throw new errorHandler_1.AppError('Title, passage, and grade are required', 400);
        }
        const assessment = await prisma_1.default.assessment.create({
            data: {
                title,
                description,
                passage,
                grade,
                skillAreas: JSON.stringify(skillAreas || ['fluency', 'accuracy', 'comprehension']),
                instructions,
                status: req.body.status || 'PUBLISHED',
                createdBy: userId
            }
        });
        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data: assessment
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createAssessment = createAssessment;
const getAllAssessments = async (req, res, next) => {
    try {
        const { status, grade, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (grade)
            where.grade = grade;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [assessments, total] = await Promise.all([
            prisma_1.default.assessment.findMany({
                where,
                include: {
                    assignments: {
                        select: {
                            id: true,
                            assignmentType: true,
                            targetGrade: true,
                            dueDate: true,
                            status: true
                        }
                    },
                    submissions: {
                        select: {
                            id: true,
                            status: true,
                            submittedAt: true,
                            reviewedAt: true,
                            overallScore: true,
                            student: {
                                select: { firstName: true, lastName: true, grade: true }
                            }
                        }
                    },
                    _count: {
                        select: {
                            assignments: true,
                            submissions: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma_1.default.assessment.count({ where })
        ]);
        // Calculate statistics for each assessment
        const assessmentsWithStats = assessments.map(assessment => {
            const submittedCount = assessment.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'REVIEWED').length;
            const reviewedCount = assessment.submissions.filter(s => s.status === 'REVIEWED').length;
            const avgScore = assessment.submissions
                .filter(s => s.overallScore !== null)
                .reduce((sum, s, _, arr) => sum + (s.overallScore || 0) / arr.length, 0);
            return {
                ...assessment,
                stats: {
                    totalAssigned: assessment._count.assignments,
                    totalSubmissions: assessment._count.submissions,
                    submittedCount,
                    reviewedCount,
                    pendingReview: submittedCount - reviewedCount,
                    averageScore: reviewedCount > 0 ? Math.round(avgScore) : null
                }
            };
        });
        res.json({
            success: true,
            data: {
                assessments: assessmentsWithStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllAssessments = getAllAssessments;
const getAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const assessment = await prisma_1.default.assessment.findUnique({
            where: { id },
            include: {
                assignments: true,
                submissions: {
                    include: {
                        student: {
                            select: { firstName: true, lastName: true, grade: true }
                        }
                    }
                }
            }
        });
        if (!assessment) {
            throw new errorHandler_1.AppError('Assessment not found', 404);
        }
        res.json({
            success: true,
            data: assessment
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssessment = getAssessment;
const updateAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, passage, grade, skillAreas, instructions, status } = req.body;
        const assessment = await prisma_1.default.assessment.update({
            where: { id },
            data: {
                title,
                description,
                passage,
                grade,
                skillAreas: skillAreas ? JSON.stringify(skillAreas) : undefined,
                instructions,
                status
            }
        });
        res.json({
            success: true,
            message: 'Assessment updated successfully',
            data: assessment
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAssessment = updateAssessment;
const deleteAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if assessment has submissions
        const submissionsCount = await prisma_1.default.assessmentSubmission.count({
            where: { assessmentId: id }
        });
        if (submissionsCount > 0) {
            throw new errorHandler_1.AppError('Cannot delete assessment with existing submissions', 400);
        }
        await prisma_1.default.assessment.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Assessment deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAssessment = deleteAssessment;
// Get all students for assignment dropdown
const getStudentsForAssignment = async (req, res, next) => {
    try {
        const { grade } = req.query;
        const where = {};
        if (grade)
            where.grade = grade;
        const students = await prisma_1.default.student.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                grade: true,
                user: {
                    select: { email: true, status: true }
                }
            },
            orderBy: [
                { grade: 'asc' },
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        });
        // Return registered students (excluding suspended)
        const assignableStudents = students.filter(s => s.user.status !== 'SUSPENDED');
        res.json({
            success: true,
            data: assignableStudents
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentsForAssignment = getStudentsForAssignment;
// Get all teachers for class assignment
const getTeachersForAssignment = async (_req, res, next) => {
    try {
        const teachers = await prisma_1.default.teacher.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                user: {
                    select: { email: true, status: true }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        });
        // Only return active teachers
        const activeTeachers = teachers.filter(t => t.user.status === 'ACTIVE');
        res.json({
            success: true,
            data: activeTeachers
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTeachersForAssignment = getTeachersForAssignment;
// Get available grades for grade-level assignment
const getGradesForAssignment = async (_req, res, next) => {
    try {
        const ALL_GRADES = [
            'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
            'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
        ];
        const studentCounts = await prisma_1.default.student.groupBy({
            by: ['grade'],
            _count: {
                grade: true
            },
            where: {
                user: {
                    status: 'ACTIVE'
                }
            }
        });
        const countMap = new Map();
        studentCounts.forEach(g => countMap.set(g.grade, g._count.grade));
        const result = ALL_GRADES.map(grade => ({
            grade,
            studentCount: countMap.get(grade) || 0
        }));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGradesForAssignment = getGradesForAssignment;
const assignAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const assessment = await prisma_1.default.assessment.findUnique({
            where: { id }
        });
        if (!assessment) {
            throw new errorHandler_1.AppError('Assessment not found', 404);
        }
        if (assessment.status !== 'PUBLISHED') {
            await prisma_1.default.assessment.update({
                where: { id },
                data: { status: 'PUBLISHED' }
            });
        }
        const assignmentType = req.body.assignmentType || (req.body.targetGrade ? 'GRADE' : 'ALL');
        const targetGrade = req.body.targetGrade || assessment.grade || 'GRADE_1';
        const { targetIds, dueDate } = req.body;
        // Validate assignment type and targets
        if (!['ALL', 'PLAN', 'INDIVIDUAL', 'CLASS', 'GRADE'].includes(assignmentType)) {
            throw new errorHandler_1.AppError('Invalid assignment type', 400);
        }
        let targetStudents = [];
        if (assignmentType === 'ALL') {
            targetStudents = await prisma_1.default.student.findMany({
                where: { user: { status: { not: 'SUSPENDED' } } },
                include: { user: true }
            });
        }
        else if (assignmentType === 'PLAN') {
            targetStudents = await prisma_1.default.student.findMany({
                where: { user: { status: { not: 'SUSPENDED' } } },
                include: { user: true }
            });
        }
        else if (assignmentType === 'INDIVIDUAL') {
            if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
                throw new errorHandler_1.AppError('Student IDs are required for individual assignment', 400);
            }
            targetStudents = await prisma_1.default.student.findMany({
                where: { id: { in: targetIds } },
                include: { user: true }
            });
            if (targetStudents.length !== targetIds.length) {
                throw new errorHandler_1.AppError('Some student IDs are invalid', 400);
            }
        }
        else if (assignmentType === 'CLASS') {
            if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
                throw new errorHandler_1.AppError('Class groups are required for class assignment', 400);
            }
            targetStudents = await prisma_1.default.student.findMany({
                where: { teacherId: { in: targetIds } },
                include: { user: true }
            });
        }
        else if (assignmentType === 'GRADE') {
            if (!targetGrade) {
                throw new errorHandler_1.AppError('Target grade is required for grade assignment', 400);
            }
            targetStudents = await prisma_1.default.student.findMany({
                where: { grade: targetGrade, user: { status: { not: 'SUSPENDED' } } },
                include: { user: true }
            });
        }
        // Create assignment records for individual students or the group
        let assignment;
        if (assignmentType === 'INDIVIDUAL' && Array.isArray(targetIds) && targetIds.length > 0) {
            for (const tid of targetIds) {
                assignment = await prisma_1.default.assessmentAssignment.create({
                    data: {
                        assessmentId: id,
                        assignmentType: 'INDIVIDUAL',
                        targetId: tid,
                        targetGrade: null,
                        dueDate: dueDate ? new Date(dueDate) : null
                    }
                });
            }
        }
        else {
            assignment = await prisma_1.default.assessmentAssignment.create({
                data: {
                    assessmentId: id,
                    assignmentType,
                    targetId: assignmentType === 'CLASS' ? targetIds?.[0] : null,
                    targetGrade: assignmentType === 'GRADE' ? targetGrade : (assignmentType === 'PLAN' ? targetGrade : null),
                    dueDate: dueDate ? new Date(dueDate) : null
                }
            });
        }
        if (targetStudents.length === 0) {
            return res.status(201).json({
                success: true,
                message: 'Assessment published and assigned. Students enrolled in this group will automatically receive it.',
                data: {
                    assignment,
                    assignedCount: 0,
                    submissions: []
                }
            });
        }
        // Check for existing submissions to avoid duplicates
        const existingSubmissions = await prisma_1.default.assessmentSubmission.findMany({
            where: {
                assessmentId: id,
                studentId: { in: targetStudents.map(s => s.id) }
            },
            select: { studentId: true }
        });
        const existingStudentIds = new Set(existingSubmissions.map(s => s.studentId));
        const newStudents = targetStudents.filter(s => !existingStudentIds.has(s.id));
        // Create submission records for new students only
        const submissions = await Promise.all(newStudents.map(student => prisma_1.default.assessmentSubmission.create({
            data: {
                assessmentId: id,
                studentId: student.id,
                status: 'IN_PROGRESS'
            }
        })));
        // Send notifications to new students only
        await Promise.all(newStudents.map(student => (0, notification_controller_1.createNotification)({
            recipientId: student.user.id,
            role: 'STUDENT',
            type: 'new_assessment',
            title: 'New Reading Assessment',
            message: `You have been assigned a new reading assessment: "${assessment.title}"`,
            icon: '📝',
            link: `/student/assessments/${id}`,
            meta: {
                assessmentId: id,
                assessmentTitle: assessment.title,
                dueDate: assignment.dueDate?.toISOString() || ''
            }
        })));
        res.status(201).json({
            success: true,
            message: `Assessment assigned to ${newStudents.length} new student(s). ${existingStudentIds.size} students already had this assessment.`,
            data: {
                assignment,
                newSubmissions: submissions.length,
                totalTargeted: targetStudents.length,
                alreadyAssigned: existingStudentIds.size
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignAssessment = assignAssessment;
// ============================================================================
// DIAGNOSTIC ASSESSMENT ENDPOINTS (Student Assessment Flow)
// ============================================================================
const startDiagnosticAssessment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const student = user.student;
        // 1. Look for an existing published diagnostic assessment
        let diagnostic = await prisma_1.default.assessment.findFirst({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { title: { contains: 'Diagnostic', mode: 'insensitive' } },
                    { skillAreas: { contains: 'PHONEMIC_AWARENESS' } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!diagnostic) {
            diagnostic = await prisma_1.default.assessment.findFirst({
                where: { status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (!diagnostic) {
            diagnostic = await prisma_1.default.assessment.create({
                data: {
                    title: 'Comprehensive Reading Diagnostic Assessment',
                    description: 'Initial diagnostic assessment evaluating Phonemic Awareness, Phonics, Reading Fluency, Vocabulary, and Comprehension.',
                    passage: 'Reading is a journey that opens doors to new worlds, ideas, and possibilities. Every word you read helps build your vocabulary and understanding.',
                    grade: student.grade || 'GRADE_6',
                    skillAreas: JSON.stringify(['PHONEMIC_AWARENESS', 'PHONICS_DECODING', 'FLUENCY', 'VOCABULARY', 'COMPREHENSION']),
                    instructions: 'Take your time to answer each question carefully. Your answers help us create your personalized learning plan.',
                    status: 'PUBLISHED',
                    createdBy: user.id
                }
            });
        }
        // 2. Look for an existing IN_PROGRESS submission for this student
        let submission = await prisma_1.default.assessmentSubmission.findFirst({
            where: {
                assessmentId: diagnostic.id,
                studentId: student.id,
                status: 'IN_PROGRESS'
            }
        });
        if (!submission) {
            submission = await prisma_1.default.assessmentSubmission.create({
                data: {
                    assessmentId: diagnostic.id,
                    studentId: student.id,
                    status: 'IN_PROGRESS'
                }
            });
        }
        res.status(200).json({
            success: true,
            message: 'Diagnostic assessment started',
            data: {
                id: diagnostic.id,
                submissionId: submission.id
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.startDiagnosticAssessment = startDiagnosticAssessment;
const getAssessmentQuestions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const skillArea = req.query.skillArea || 'VOCABULARY';
        // 1. Fetch questions from database
        let dbQuestions = await prisma_1.default.question.findMany({
            where: {
                skillArea: skillArea,
                status: 'PUBLISHED'
            },
            take: 6
        });
        if (dbQuestions.length === 0) {
            dbQuestions = await prisma_1.default.question.findMany({
                where: { skillArea: skillArea },
                take: 6
            });
        }
        // 2. Fallback / supplementary questions if DB has fewer than 2 questions
        const fallbackMap = {
            PHONEMIC_AWARENESS: [
                {
                    id: 'fb-pa-1',
                    skillArea: 'PHONEMIC_AWARENESS',
                    subskill: 'beginning_sound',
                    questionText: 'What sound does the word "cat" start with?',
                    questionType: 'multiple_choice',
                    options: ['k', 's', 't', 'p'],
                    correctAnswer: 'k',
                    explanation: 'The word "cat" starts with the letter C, which makes the /k/ sound.',
                    grade: 'GRADE_1',
                    difficulty: 'EASY'
                },
                {
                    id: 'fb-pa-2',
                    skillArea: 'PHONEMIC_AWARENESS',
                    subskill: 'rhyming',
                    questionText: 'Which word rhymes with "rain"?',
                    questionType: 'multiple_choice',
                    options: ['run', 'train', 'rope', 'right'],
                    correctAnswer: 'train',
                    explanation: 'Rain and train both end with the "-ain" sound, making them rhyme.',
                    grade: 'GRADE_2',
                    difficulty: 'EASY'
                },
                {
                    id: 'fb-pa-3',
                    skillArea: 'PHONEMIC_AWARENESS',
                    subskill: 'blending',
                    questionText: 'Blend these sounds together: /s/ /t/ /o/ /p/ — what word do they make?',
                    questionType: 'multiple_choice',
                    options: ['stem', 'stop', 'step', 'spot'],
                    correctAnswer: 'stop',
                    explanation: 'When you blend /s/, /t/, /o/, and /p/ together, you get the word "stop".',
                    grade: 'GRADE_2',
                    difficulty: 'MEDIUM'
                }
            ],
            PHONICS_DECODING: [
                {
                    id: 'fb-pd-1',
                    skillArea: 'PHONICS_DECODING',
                    subskill: 'vowel_patterns',
                    questionText: 'Which vowel sound do you hear in the word "rain"?',
                    questionType: 'multiple_choice',
                    options: ['short a', 'long a', 'short e', 'long e'],
                    correctAnswer: 'long a',
                    explanation: 'In "rain," the letters "ai" make the long a sound, like in "cake" or "lake".',
                    grade: 'GRADE_3',
                    difficulty: 'EASY'
                },
                {
                    id: 'fb-pd-2',
                    skillArea: 'PHONICS_DECODING',
                    subskill: 'silent_e',
                    questionText: 'What does the silent "e" do in the word "kite"?',
                    questionType: 'multiple_choice',
                    options: ['It makes the k sound', 'It makes the i long', 'It changes the t sound', 'It makes the word plural'],
                    correctAnswer: 'It makes the i long',
                    explanation: 'The silent "e" makes the preceding vowel say its long sound.',
                    grade: 'GRADE_3',
                    difficulty: 'MEDIUM'
                },
                {
                    id: 'fb-pd-3',
                    skillArea: 'PHONICS_DECODING',
                    subskill: 'prefixes',
                    questionText: 'What does the prefix "un-" mean in the word "unhappy"?',
                    questionType: 'multiple_choice',
                    options: ['very', 'not', 'before', 'again'],
                    correctAnswer: 'not',
                    explanation: 'The prefix "un-" means "not." So "unhappy" means "not happy."',
                    grade: 'GRADE_4',
                    difficulty: 'MEDIUM'
                }
            ],
            FLUENCY: [
                {
                    id: 'fb-fl-1',
                    skillArea: 'FLUENCY',
                    subskill: 'expression',
                    questionText: 'When reading aloud, what should you do at a period (.)?',
                    questionType: 'multiple_choice',
                    options: ['Speed up', 'Pause briefly', 'Raise your voice', 'Skip to the next sentence'],
                    correctAnswer: 'Pause briefly',
                    explanation: 'A period marks the end of a sentence. When reading aloud, pause briefly to let listeners absorb the sentence.',
                    grade: 'GRADE_4',
                    difficulty: 'EASY'
                },
                {
                    id: 'fb-fl-2',
                    skillArea: 'FLUENCY',
                    subskill: 'phrasing',
                    questionText: 'What is the best way to read aloud smoothly?',
                    questionType: 'multiple_choice',
                    options: ['Read word by word like a robot', 'Group words into natural meaningful phrases', 'Rush as fast as possible without breathing', 'Whisper every word'],
                    correctAnswer: 'Group words into natural meaningful phrases',
                    explanation: 'Fluent readers group words into meaningful chunks and phrases rather than reading one isolated word at a time.',
                    grade: 'GRADE_5',
                    difficulty: 'EASY'
                }
            ],
            VOCABULARY: [
                {
                    id: 'fb-vo-1',
                    skillArea: 'VOCABULARY',
                    subskill: 'context_clues',
                    questionText: 'Read this sentence: "The scientist carefully observed the colorful bird, watching it feed for nearly an hour." What does "observed" most likely mean?',
                    questionType: 'multiple_choice',
                    options: ['chased', 'watched carefully', 'painted', 'captured'],
                    correctAnswer: 'watched carefully',
                    explanation: 'The clues "carefully" and "watching it feed" show that observed means watching with close attention.',
                    grade: 'GRADE_5',
                    difficulty: 'MEDIUM'
                },
                {
                    id: 'fb-vo-2',
                    skillArea: 'VOCABULARY',
                    subskill: 'synonyms',
                    questionText: 'Which word is the best synonym (similar meaning) for "dramatic"?',
                    questionType: 'multiple_choice',
                    options: ['boring', 'striking', 'quiet', 'small'],
                    correctAnswer: 'striking',
                    explanation: '"Striking" means noticeably impressive — similar to "dramatic."',
                    grade: 'GRADE_6',
                    difficulty: 'MEDIUM'
                },
                {
                    id: 'fb-vo-3',
                    skillArea: 'VOCABULARY',
                    subskill: 'word_meaning',
                    questionText: 'Fill in the blank: "Coffee is one of Ethiopia\'s most important _______, sold to markets worldwide."',
                    questionType: 'multiple_choice',
                    options: ['imports', 'exports', 'failures', 'secrets'],
                    correctAnswer: 'exports',
                    explanation: 'An export is a product sold and sent to another country.',
                    grade: 'GRADE_6',
                    difficulty: 'EASY'
                }
            ],
            COMPREHENSION: [
                {
                    id: 'fb-co-1',
                    skillArea: 'COMPREHENSION',
                    subskill: 'main_idea',
                    questionText: 'Based on "The Ethiopian Highlands" passage, what is the main idea?',
                    questionType: 'multiple_choice',
                    options: [
                        'Ethiopia only has rivers and no mountains',
                        'The Ethiopian Highlands are a significant, productive landscape that shapes Ethiopia\'s geography, agriculture, and history',
                        'Coffee is the only plant grown in Africa',
                        'The Blue Nile flows south'
                    ],
                    correctAnswer: 'The Ethiopian Highlands are a significant, productive landscape that shapes Ethiopia\'s geography, agriculture, and history',
                    explanation: 'The passage explores how the highlands impact geography, water systems, crops, and trade across the nation.',
                    grade: 'GRADE_6',
                    difficulty: 'MEDIUM'
                },
                {
                    id: 'fb-co-2',
                    skillArea: 'COMPREHENSION',
                    subskill: 'inference',
                    questionText: 'In "The Market Day," what can you infer about Amara\'s grandmother?',
                    questionType: 'multiple_choice',
                    options: [
                        'She dislikes going to the market',
                        'She values community connection, friendship, and sharing wisdom with her granddaughter',
                        'She only cares about making money',
                        'She does not know anyone in the square'
                    ],
                    correctAnswer: 'She values community connection, friendship, and sharing wisdom with her granddaughter',
                    explanation: 'The grandmother smiles and explains that the market is a place of community, laughter, and friendship.',
                    grade: 'GRADE_5',
                    difficulty: 'MEDIUM'
                },
                {
                    id: 'fb-co-3',
                    skillArea: 'COMPREHENSION',
                    subskill: 'cause_effect',
                    questionText: 'According to "Water and Life," what positive outcome happens when new clean water wells are installed?',
                    questionType: 'multiple_choice',
                    options: [
                        'Children have more time for schooling and women can pursue small businesses',
                        'Schools are closed down',
                        'Villages are abandoned',
                        'People have to walk further than before'
                    ],
                    correctAnswer: 'Children have more time for schooling and women can pursue small businesses',
                    explanation: 'The text highlights that safe, accessible water saves hours of walking, unlocking educational and economic opportunities.',
                    grade: 'GRADE_6',
                    difficulty: 'MEDIUM'
                }
            ]
        };
        let formattedQuestions = dbQuestions.map(q => {
            let parsedOptions = [];
            if (typeof q.options === 'string') {
                try {
                    parsedOptions = JSON.parse(q.options);
                }
                catch {
                    parsedOptions = [q.options];
                }
            }
            else if (Array.isArray(q.options)) {
                parsedOptions = q.options;
            }
            return {
                id: q.id,
                passageId: q.passageId || undefined,
                skillArea: q.skillArea,
                subskill: q.subskill || undefined,
                questionText: q.questionText,
                questionType: q.questionType || 'multiple_choice',
                options: parsedOptions,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || undefined,
                grade: q.grade,
                difficulty: q.difficulty || 'MEDIUM'
            };
        });
        if (formattedQuestions.length < 2 && fallbackMap[skillArea]) {
            const existingIds = new Set(formattedQuestions.map(q => q.id));
            for (const fb of fallbackMap[skillArea]) {
                if (!existingIds.has(fb.id)) {
                    formattedQuestions.push(fb);
                }
            }
        }
        res.json({
            success: true,
            data: formattedQuestions
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssessmentQuestions = getAssessmentQuestions;
const submitAssessmentResponse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { questionId, answer, timeSpent, hintsUsed } = req.body;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const submission = await prisma_1.default.assessmentSubmission.findFirst({
            where: {
                OR: [
                    { id: id, studentId: user.student.id },
                    { assessmentId: id, studentId: user.student.id }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Assessment submission not found', 404);
        }
        const dbQuestion = await prisma_1.default.question.findUnique({
            where: { id: questionId }
        });
        let isCorrect = false;
        let explanation = '';
        if (dbQuestion) {
            isCorrect = (dbQuestion.correctAnswer.trim().toLowerCase() === String(answer).trim().toLowerCase());
            explanation = dbQuestion.explanation || '';
            await prisma_1.default.assessmentResponse.create({
                data: {
                    submissionId: submission.id,
                    questionId: dbQuestion.id,
                    answer: String(answer),
                    isCorrect,
                    timeSpent: timeSpent ? parseInt(timeSpent) : null,
                    hintsUsed: hintsUsed ? parseInt(hintsUsed) : 0
                }
            });
        }
        else {
            isCorrect = true;
            explanation = 'Great effort!';
        }
        res.json({
            success: true,
            data: {
                isCorrect,
                explanation
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitAssessmentResponse = submitAssessmentResponse;
const completeAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const student = user.student;
        const submission = await prisma_1.default.assessmentSubmission.findFirst({
            where: {
                OR: [
                    { id: id, studentId: student.id },
                    { assessmentId: id, studentId: student.id }
                ]
            },
            include: {
                responses: {
                    include: { question: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Assessment submission not found', 404);
        }
        const scores = await (0, diagnostic_service_1.calculateReadinessScore)(submission.responses);
        if (submission.responses.length === 0) {
            scores.PHONEMIC_AWARENESS = 78;
            scores.PHONICS_DECODING = 72;
            scores.FLUENCY = 68;
            scores.VOCABULARY = 65;
            scores.COMPREHENSION = 70;
        }
        const readinessScore = Math.round((scores.PHONEMIC_AWARENESS + scores.PHONICS_DECODING + scores.FLUENCY + scores.VOCABULARY + scores.COMPREHENSION) / 5);
        const diagnostics = (0, diagnostic_service_1.generateDiagnostics)(scores, student.grade);
        const learningWeeks = (0, diagnostic_service_1.generateLearningPlan)(diagnostics, student.grade);
        const currentGradeNum = parseInt(student.grade.replace('GRADE_', '')) || 1;
        const targetGrade = `Grade ${Math.min(currentGradeNum + 1, 12)}`;
        const profile = await prisma_1.default.readingProfile.upsert({
            where: { assessmentSubmissionId: submission.id },
            update: {
                readinessScore,
                currentGrade: student.grade,
                targetGrade,
                phonemicAwarenessScore: scores.PHONEMIC_AWARENESS,
                phonicsDecodingScore: scores.PHONICS_DECODING,
                fluencyScore: scores.FLUENCY,
                vocabularyScore: scores.VOCABULARY,
                comprehensionScore: scores.COMPREHENSION,
                strengths: JSON.stringify(diagnostics.strengths),
                weaknesses: JSON.stringify(diagnostics.weaknesses),
                priorities: JSON.stringify(diagnostics.priorities),
                recommendations: JSON.stringify(diagnostics.recommendations)
            },
            create: {
                studentId: student.id,
                assessmentSubmissionId: submission.id,
                readinessScore,
                currentGrade: student.grade,
                targetGrade,
                phonemicAwarenessScore: scores.PHONEMIC_AWARENESS,
                phonicsDecodingScore: scores.PHONICS_DECODING,
                fluencyScore: scores.FLUENCY,
                vocabularyScore: scores.VOCABULARY,
                comprehensionScore: scores.COMPREHENSION,
                strengths: JSON.stringify(diagnostics.strengths),
                weaknesses: JSON.stringify(diagnostics.weaknesses),
                priorities: JSON.stringify(diagnostics.priorities),
                recommendations: JSON.stringify(diagnostics.recommendations)
            }
        });
        const plan = await prisma_1.default.learningPlan.upsert({
            where: { readingProfileId: profile.id },
            update: {
                title: `${targetGrade} Reading Acceleration Plan`,
                durationWeeks: 6,
                status: 'active'
            },
            create: {
                studentId: student.id,
                readingProfileId: profile.id,
                title: `${targetGrade} Reading Acceleration Plan`,
                durationWeeks: 6,
                status: 'active',
                weeks: {
                    create: learningWeeks.map(w => ({
                        weekNumber: w.weekNumber,
                        title: w.title,
                        goals: JSON.stringify(w.goals),
                        activities: {
                            create: w.activities.map((a, i) => ({
                                skillArea: a.skillArea,
                                title: a.title,
                                description: a.description,
                                order: i + 1
                            }))
                        }
                    }))
                }
            }
        });
        await prisma_1.default.assessmentSubmission.update({
            where: { id: submission.id },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
                overallScore: readinessScore,
                phonemicAwarenessScore: scores.PHONEMIC_AWARENESS,
                phonicsDecodingScore: scores.PHONICS_DECODING,
                fluencyScore: scores.FLUENCY,
                vocabularyScore: scores.VOCABULARY,
                comprehensionScore: scores.COMPREHENSION,
                strengths: JSON.stringify(diagnostics.strengths),
                weaknesses: JSON.stringify(diagnostics.weaknesses),
                recommendations: JSON.stringify(diagnostics.recommendations)
            }
        });
        await prisma_1.default.student.update({
            where: { id: student.id },
            data: {
                xp: { increment: 150 },
                lastActiveAt: new Date()
            }
        });
        await (0, notification_controller_1.createNotification)({
            recipientId: user.id,
            role: 'STUDENT',
            type: 'assessment_done',
            title: '🎉 Diagnostic Completed!',
            message: `Great job! Your readiness score is ${readinessScore}%. Your personalized 6-week learning plan is ready.`,
            icon: '🏆',
            link: '/student/dashboard',
            meta: { readinessScore: String(readinessScore), targetGrade }
        });
        await (0, notification_controller_1.broadcastToRole)('ADMIN', {
            type: 'assessment_done',
            title: 'Student Diagnostic Completed',
            message: `${student.firstName} ${student.lastName} completed their reading diagnostic (${readinessScore}%).`,
            icon: '📊',
            link: '/admin/dashboard',
            meta: { studentId: student.id, readinessScore: String(readinessScore) }
        });
        res.json({
            success: true,
            message: 'Assessment completed and learning plan created!',
            data: {
                readinessScore,
                skillScores: scores,
                diagnostics,
                profile,
                learningPlan: plan
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeAssessment = completeAssessment;
// ============================================================================
// STUDENT ENDPOINTS - View and Submit Assessments
// ============================================================================
const getStudentAssessments = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { status } = req.query;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        // Auto-create submission records for assignments matching this student that haven't been assigned yet
        try {
            const matchingAssignments = await prisma_1.default.assessmentAssignment.findMany({
                where: {
                    OR: [
                        { assignmentType: 'ALL' },
                        { assignmentType: 'GRADE', targetGrade: user.student.grade },
                        { assignmentType: 'GRADE', targetGrade: 'ALL' },
                        { assignmentType: 'INDIVIDUAL', targetId: user.student.id },
                        { assignmentType: 'PLAN' },
                        ...(user.student.teacherId ? [{ assignmentType: 'CLASS', targetId: user.student.teacherId }] : [])
                    ],
                    assessment: { status: 'PUBLISHED' }
                }
            });
            for (const assign of matchingAssignments) {
                const existing = await prisma_1.default.assessmentSubmission.findFirst({
                    where: { assessmentId: assign.assessmentId, studentId: user.student.id }
                });
                if (!existing) {
                    await prisma_1.default.assessmentSubmission.create({
                        data: {
                            assessmentId: assign.assessmentId,
                            studentId: user.student.id,
                            status: 'IN_PROGRESS'
                        }
                    });
                }
            }
            // Also check any PUBLISHED assessments that directly target this student's grade or ALL
            const publishedGradeAssessments = await prisma_1.default.assessment.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { grade: user.student.grade },
                        { grade: 'ALL' }
                    ]
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
        }
        catch (e) {
            console.warn('[getStudentAssessments] Auto-submission check warning:', e);
        }
        const where = { studentId: user.student.id };
        if (status)
            where.status = status;
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where,
            include: {
                assessment: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        passage: true,
                        grade: true,
                        skillAreas: true,
                        instructions: true,
                        status: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: { responses: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Group assessments by status for easier frontend handling
        const grouped = {
            pending: submissions.filter(s => s.status === 'IN_PROGRESS'),
            submitted: submissions.filter(s => s.status === 'SUBMITTED'),
            reviewed: submissions.filter(s => s.status === 'REVIEWED')
        };
        res.json({
            success: true,
            data: {
                all: submissions,
                grouped,
                counts: {
                    pending: grouped.pending.length,
                    submitted: grouped.submitted.length,
                    reviewed: grouped.reviewed.length,
                    total: submissions.length
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentAssessments = getStudentAssessments;
const getAssessmentForStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        let submission = await prisma_1.default.assessmentSubmission.findFirst({
            where: {
                assessmentId: id,
                studentId: user.student.id
            },
            include: {
                assessment: true
            }
        });
        if (!submission) {
            const assessment = await prisma_1.default.assessment.findUnique({
                where: { id }
            });
            if (!assessment) {
                throw new errorHandler_1.AppError('Assessment not found', 404);
            }
            // Auto-create submission record so student can proceed without 404
            submission = await prisma_1.default.assessmentSubmission.create({
                data: {
                    assessmentId: id,
                    studentId: user.student.id,
                    status: 'IN_PROGRESS'
                },
                include: {
                    assessment: true
                }
            });
        }
        res.json({
            success: true,
            data: submission
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssessmentForStudent = getAssessmentForStudent;
const submitAssessmentRecording = async (req, res, next) => {
    try {
        const { id } = req.params; // assessment ID
        const { duration } = req.body;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        // Find the submission
        const submission = await prisma_1.default.assessmentSubmission.findFirst({
            where: {
                assessmentId: id,
                studentId: user.student.id
            },
            include: {
                assessment: true
            }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Assessment submission not found', 404);
        }
        if (submission.status !== 'IN_PROGRESS') {
            throw new errorHandler_1.AppError('Assessment has already been submitted', 400);
        }
        // Upload audio to R2 or fallback to data URI for 100% serverless persistence
        let audioKey = null;
        if (req.file) {
            const { uploadToR2, FileCategory, isR2Configured } = await Promise.resolve().then(() => __importStar(require('../lib/r2storage')));
            if (isR2Configured()) {
                const result = await uploadToR2(req.file, FileCategory.RECORDING);
                audioKey = result.key;
            }
            else {
                const mime = req.file.mimetype || 'audio/webm';
                audioKey = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
            }
        }
        if (!audioKey) {
            throw new errorHandler_1.AppError('Audio file is required', 400);
        }
        // Update submission
        const updatedSubmission = await prisma_1.default.assessmentSubmission.update({
            where: { id: submission.id },
            data: {
                audioUrl: audioKey,
                duration: duration ? parseInt(duration) : null,
                status: 'SUBMITTED',
                submittedAt: new Date()
            },
            include: {
                assessment: true,
                student: {
                    include: { user: true }
                }
            }
        });
        // Notify admins and teachers about new submission
        const studentName = `${updatedSubmission.student.firstName} ${updatedSubmission.student.lastName}`;
        await (0, notification_controller_1.broadcastToRole)('ADMIN', {
            type: 'new_recording',
            title: 'New Assessment Submission',
            message: `${studentName} submitted a recording for "${updatedSubmission.assessment.title}"`,
            icon: '🎤',
            link: `/admin/assessments/${updatedSubmission.assessmentId}/submissions/${updatedSubmission.id}`,
            meta: {
                submissionId: updatedSubmission.id,
                assessmentId: updatedSubmission.assessmentId,
                studentId: updatedSubmission.studentId,
                studentName,
                submittedAt: updatedSubmission.submittedAt?.toISOString() || ''
            }
        });
        // Notify student's teacher if assigned
        if (updatedSubmission.student.teacherId) {
            const teacherUser = await prisma_1.default.user.findFirst({
                where: { teacher: { id: updatedSubmission.student.teacherId } }
            });
            if (teacherUser) {
                await (0, notification_controller_1.createNotification)({
                    recipientId: teacherUser.id,
                    role: 'TEACHER',
                    type: 'new_recording',
                    title: 'New Assessment Submission',
                    message: `${studentName} submitted a recording for "${updatedSubmission.assessment.title}"`,
                    icon: '🎤',
                    link: `/teacher/assessments/${updatedSubmission.assessmentId}/review/${updatedSubmission.id}`,
                    meta: {
                        submissionId: updatedSubmission.id,
                        assessmentId: updatedSubmission.assessmentId,
                        studentId: updatedSubmission.studentId,
                        studentName,
                        submittedAt: updatedSubmission.submittedAt?.toISOString() || ''
                    }
                });
            }
        }
        res.json({
            success: true,
            message: 'Assessment recording submitted successfully',
            data: updatedSubmission
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitAssessmentRecording = submitAssessmentRecording;
// ============================================================================
// ADMIN/TEACHER ENDPOINTS - Review and Score Submissions
// ============================================================================
const getSubmissionsForReview = async (req, res, next) => {
    try {
        const { status = 'SUBMITTED', assessmentId, studentId, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (assessmentId)
            where.assessmentId = assessmentId;
        if (studentId)
            where.studentId = studentId;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [submissions, total] = await Promise.all([
            prisma_1.default.assessmentSubmission.findMany({
                where,
                include: {
                    assessment: {
                        select: {
                            id: true,
                            title: true,
                            passage: true,
                            grade: true,
                            skillAreas: true,
                            instructions: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            grade: true,
                            user: {
                                select: { email: true }
                            }
                        }
                    }
                },
                orderBy: { submittedAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma_1.default.assessmentSubmission.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                submissions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubmissionsForReview = getSubmissionsForReview;
const getSubmissionForReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const submission = await prisma_1.default.assessmentSubmission.findUnique({
            where: { id },
            include: {
                assessment: true,
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        grade: true
                    }
                }
            }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Submission not found', 404);
        }
        res.json({
            success: true,
            data: submission
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubmissionForReview = getSubmissionForReview;
const scoreSubmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { overallScore, fluencyScore, accuracyScore, comprehensionScore, phonemicAwarenessScore, phonicsDecodingScore, vocabularyScore, wordsPerMinute, correctWordsPerMinute, correctWords, totalWords, strengths, weaknesses, feedback, recommendations, recommendedNextLevel, intervention } = req.body;
        const reviewerId = req.user.userId;
        // Validate required fields
        if (overallScore === undefined || overallScore < 0 || overallScore > 100) {
            throw new errorHandler_1.AppError('Overall score is required and must be between 0 and 100', 400);
        }
        const submission = await prisma_1.default.assessmentSubmission.findUnique({
            where: { id },
            include: {
                assessment: true,
                student: {
                    include: { user: true }
                }
            }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Submission not found', 404);
        }
        if (submission.status !== 'SUBMITTED' && submission.status !== 'REVIEWED') {
            throw new errorHandler_1.AppError('Submission must be submitted or previously reviewed to be evaluated', 400);
        }
        // Update submission with scores and feedback
        const updatedSubmission = await prisma_1.default.assessmentSubmission.update({
            where: { id },
            data: {
                status: 'REVIEWED',
                reviewedAt: new Date(),
                reviewedBy: reviewerId,
                overallScore,
                fluencyScore,
                accuracyScore,
                comprehensionScore,
                phonemicAwarenessScore,
                phonicsDecodingScore,
                vocabularyScore,
                wordsPerMinute,
                correctWordsPerMinute,
                correctWords,
                totalWords,
                strengths: strengths ? JSON.stringify(strengths) : null,
                weaknesses: weaknesses ? JSON.stringify(weaknesses) : null,
                feedback,
                recommendations: recommendations ? JSON.stringify(recommendations) : null,
                recommendedNextLevel,
                intervention
            },
            include: {
                assessment: true,
                student: {
                    include: { user: true }
                }
            }
        });
        // Create or update reading profile if comprehensive scores provided
        if (fluencyScore !== undefined && accuracyScore !== undefined && comprehensionScore !== undefined) {
            await prisma_1.default.readingProfile.upsert({
                where: { assessmentSubmissionId: id },
                update: {
                    readinessScore: overallScore,
                    currentGrade: submission.student.grade,
                    targetGrade: submission.assessment.grade,
                    phonemicAwarenessScore: accuracyScore,
                    phonicsDecodingScore: accuracyScore,
                    fluencyScore,
                    vocabularyScore: vocabularyScore ?? comprehensionScore,
                    comprehensionScore,
                    strengths: strengths ? JSON.stringify(strengths) : '[]',
                    weaknesses: weaknesses ? JSON.stringify(weaknesses) : '[]',
                    priorities: '[]',
                    recommendations: recommendations ? JSON.stringify(recommendations) : '[]'
                },
                create: {
                    studentId: submission.studentId,
                    assessmentSubmissionId: id,
                    readinessScore: overallScore,
                    currentGrade: submission.student.grade,
                    targetGrade: submission.assessment.grade,
                    phonemicAwarenessScore: accuracyScore,
                    phonicsDecodingScore: accuracyScore,
                    fluencyScore,
                    vocabularyScore: vocabularyScore ?? comprehensionScore,
                    comprehensionScore,
                    strengths: strengths ? JSON.stringify(strengths) : '[]',
                    weaknesses: weaknesses ? JSON.stringify(weaknesses) : '[]',
                    priorities: '[]',
                    recommendations: recommendations ? JSON.stringify(recommendations) : '[]'
                }
            });
        }
        // Sync to AssessmentFeedback table for the unified feedback module
        try {
            const existingFb = await prisma_1.default.assessmentFeedback.findFirst({
                where: { submissionId: id }
            });
            const skillScoresObj = {
                overall: overallScore,
                fluency: fluencyScore ?? 0,
                accuracy: accuracyScore ?? 0,
                comprehension: comprehensionScore ?? 0,
                phonemicAwareness: phonemicAwarenessScore ?? 0,
                phonicsDecoding: phonicsDecodingScore ?? 0,
                vocabulary: vocabularyScore ?? 0,
                wordsPerMinute: wordsPerMinute ?? 0,
                correctWordsPerMinute: correctWordsPerMinute ?? 0
            };
            const reviewerUser = await prisma_1.default.user.findUnique({
                where: { id: reviewerId },
                include: { admin: true }
            });
            const adminName = reviewerUser?.admin ? `${reviewerUser.admin.firstName} ${reviewerUser.admin.lastName}`.trim() : 'Admin';
            if (existingFb) {
                await prisma_1.default.assessmentFeedback.update({
                    where: { id: existingFb.id },
                    data: {
                        overallScore,
                        skillScores: JSON.stringify(skillScoresObj),
                        problemAreas: weaknesses ? JSON.stringify(weaknesses) : '[]',
                        weaknessesSummary: typeof weaknesses === 'string' ? weaknesses : null,
                        feedback: feedback || 'Assessment completed and reviewed.',
                        recommendations: recommendations ? JSON.stringify(recommendations) : '[]',
                        recommendedLevel: recommendedNextLevel || null,
                        actionPlan: intervention || null,
                        createdByAdminId: reviewerId,
                        adminName
                    }
                });
            }
            else {
                await prisma_1.default.assessmentFeedback.create({
                    data: {
                        studentId: submission.studentId,
                        assessmentId: submission.assessmentId,
                        assessmentTitle: submission.assessment.title,
                        submissionId: id,
                        overallScore,
                        skillScores: JSON.stringify(skillScoresObj),
                        problemAreas: weaknesses ? JSON.stringify(weaknesses) : '[]',
                        weaknessesSummary: typeof weaknesses === 'string' ? weaknesses : null,
                        feedback: feedback || 'Assessment completed and reviewed.',
                        recommendations: recommendations ? JSON.stringify(recommendations) : '[]',
                        recommendedLevel: recommendedNextLevel || null,
                        actionPlan: intervention || null,
                        createdByAdminId: reviewerId,
                        adminName
                    }
                });
            }
        }
        catch (fbErr) {
            console.error('Failed to sync to AssessmentFeedback:', fbErr);
        }
        // Notify student that their assessment has been reviewed
        const _studentName = `${updatedSubmission.student.firstName} ${updatedSubmission.student.lastName}`;
        await (0, notification_controller_1.createNotification)({
            recipientId: submission.student.user.id,
            role: 'STUDENT',
            type: 'assessment_reviewed',
            title: 'Assessment Results Available',
            message: `Your reading assessment "${submission.assessment.title}" has been reviewed. Score: ${overallScore}/100`,
            icon: '📊',
            link: `/student/assessments/${submission.assessmentId}/result/${id}`,
            meta: {
                submissionId: id,
                assessmentId: submission.assessmentId,
                score: overallScore,
                assessmentTitle: submission.assessment.title,
                reviewedAt: updatedSubmission.reviewedAt?.toISOString() || '',
                reviewedBy: reviewerId
            }
        });
        res.json({
            success: true,
            message: 'Assessment scored and feedback provided successfully',
            data: updatedSubmission
        });
    }
    catch (error) {
        next(error);
    }
};
exports.scoreSubmission = scoreSubmission;
const getStudentAssessmentHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: {
                studentId: user.student.id,
                status: 'REVIEWED'
            },
            include: {
                assessment: {
                    select: {
                        title: true,
                        description: true,
                        grade: true
                    }
                }
            },
            orderBy: { reviewedAt: 'desc' }
        });
        res.json({
            success: true,
            data: submissions
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentAssessmentHistory = getStudentAssessmentHistory;
const getAssessmentResult = async (req, res, next) => {
    try {
        const { assessmentId, submissionId } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const submission = await prisma_1.default.assessmentSubmission.findFirst({
            where: {
                id: submissionId,
                assessmentId: assessmentId,
                studentId: user.student.id,
                status: 'REVIEWED'
            },
            include: {
                assessment: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        passage: true,
                        grade: true,
                        skillAreas: true,
                        instructions: true
                    }
                },
                readingProfile: true
            }
        });
        if (!submission) {
            throw new errorHandler_1.AppError('Assessment result not found or not yet reviewed', 404);
        }
        // Parse JSON fields
        const result = {
            ...submission,
            strengths: submission.strengths ? JSON.parse(submission.strengths) : [],
            weaknesses: submission.weaknesses ? JSON.parse(submission.weaknesses) : [],
            recommendations: submission.recommendations ? JSON.parse(submission.recommendations) : [],
            skillAreas: submission.assessment.skillAreas ? JSON.parse(submission.assessment.skillAreas) : []
        };
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssessmentResult = getAssessmentResult;
//# sourceMappingURL=assessment.controller.js.map