"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeActivity = exports.getLesson = exports.getLessons = exports.getLearningPlan = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getLearningPlan = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const plan = await prisma_1.default.learningPlan.findFirst({
            where: { studentId: user.student.id, status: 'active' },
            include: {
                weeks: {
                    orderBy: { weekNumber: 'asc' },
                    include: {
                        activities: {
                            orderBy: { order: 'asc' },
                            include: { lesson: true }
                        }
                    }
                }
            }
        });
        res.json({ success: true, data: plan });
    }
    catch (error) {
        next(error);
    }
};
exports.getLearningPlan = getLearningPlan;
const getLessons = async (req, res, next) => {
    try {
        const { skillArea, grade } = req.query;
        const lessons = await prisma_1.default.lesson.findMany({
            where: {
                ...(skillArea && { skillArea: skillArea }),
                ...(grade && { grade: grade })
            },
            orderBy: [{ skillArea: 'asc' }, { order: 'asc' }]
        });
        res.json({ success: true, data: lessons });
    }
    catch (error) {
        next(error);
    }
};
exports.getLessons = getLessons;
const getLesson = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lesson = await prisma_1.default.lesson.findUnique({
            where: { id }
        });
        if (!lesson)
            throw new errorHandler_1.AppError('Lesson not found', 404);
        res.json({ success: true, data: lesson });
    }
    catch (error) {
        next(error);
    }
};
exports.getLesson = getLesson;
const completeActivity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const activity = await prisma_1.default.learningActivity.update({
            where: { id },
            data: { completed: true, completedAt: new Date() }
        });
        // Award XP
        await prisma_1.default.student.update({
            where: { id: user.student.id },
            data: { xp: { increment: 10 } }
        });
        res.json({ success: true, data: activity });
    }
    catch (error) {
        next(error);
    }
};
exports.completeActivity = completeActivity;
//# sourceMappingURL=learning.controller.js.map