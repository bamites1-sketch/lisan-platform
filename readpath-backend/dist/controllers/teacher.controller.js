"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassAnalytics = exports.getStudentDetail = exports.getStudents = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getStudents = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                teacher: {
                    include: {
                        students: {
                            include: {
                                readingProfiles: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!user || !user.teacher)
            throw new errorHandler_1.AppError('Teacher not found', 404);
        const students = user.teacher.students.map(student => {
            const profile = student.readingProfiles[0];
            const score = profile?.readinessScore || 0;
            return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                grade: student.grade,
                readinessScore: score,
                status: score >= 75 ? 'READY' : score >= 60 ? 'DEVELOPING' : 'NEEDS_SUPPORT',
                lastActive: student.lastActiveAt
            };
        });
        // Summary analytics
        const ready = students.filter(s => s.status === 'READY').length;
        const developing = students.filter(s => s.status === 'DEVELOPING').length;
        const needsSupport = students.filter(s => s.status === 'NEEDS_SUPPORT').length;
        res.json({
            success: true,
            data: {
                students,
                summary: {
                    total: students.length,
                    ready,
                    developing,
                    needsSupport
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudents = getStudents;
const getStudentDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { teacher: true }
        });
        if (!user || !user.teacher)
            throw new errorHandler_1.AppError('Teacher not found', 404);
        const student = await prisma_1.default.student.findFirst({
            where: { id, teacherId: user.teacher.id },
            include: {
                readingProfiles: {
                    orderBy: { createdAt: 'desc' },
                    take: 3
                },
                assessments: {
                    where: { status: 'COMPLETED' },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!student)
            throw new errorHandler_1.AppError('Student not found', 404);
        res.json({ success: true, data: student });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentDetail = getStudentDetail;
const getClassAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { teacher: { include: { students: { include: { readingProfiles: { orderBy: { createdAt: 'desc' }, take: 1 } } } } } }
        });
        if (!user || !user.teacher)
            throw new errorHandler_1.AppError('Teacher not found', 404);
        const students = user.teacher.students;
        const profiles = students.map(s => s.readingProfiles[0]).filter(Boolean);
        const avgScore = profiles.length > 0
            ? Math.round(profiles.reduce((sum, p) => sum + p.readinessScore, 0) / profiles.length)
            : 0;
        res.json({
            success: true,
            data: {
                totalStudents: students.length,
                avgReadinessScore: avgScore,
                skillAverages: {
                    phonemicAwareness: Math.round(profiles.reduce((s, p) => s + (p?.phonemicAwarenessScore || 0), 0) / (profiles.length || 1)),
                    phonicsDecoding: Math.round(profiles.reduce((s, p) => s + (p?.phonicsDecodingScore || 0), 0) / (profiles.length || 1)),
                    fluency: Math.round(profiles.reduce((s, p) => s + (p?.fluencyScore || 0), 0) / (profiles.length || 1)),
                    vocabulary: Math.round(profiles.reduce((s, p) => s + (p?.vocabularyScore || 0), 0) / (profiles.length || 1)),
                    comprehension: Math.round(profiles.reduce((s, p) => s + (p?.comprehensionScore || 0), 0) / (profiles.length || 1))
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getClassAnalytics = getClassAnalytics;
//# sourceMappingURL=teacher.controller.js.map