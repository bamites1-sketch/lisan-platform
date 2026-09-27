"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPracticeHistory = exports.completePractice = exports.submitPracticeResponse = exports.startPractice = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const startPractice = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { skillArea } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const practice = await prisma_1.default.practiceHistory.create({
            data: {
                studentId: user.student.id,
                skillArea
            }
        });
        // Get adaptive questions for this skill area
        const questions = await prisma_1.default.question.findMany({
            where: {
                skillArea,
                grade: user.student.grade
            },
            take: 5,
            orderBy: { successRate: 'asc' } // Start with harder questions first
        });
        res.json({
            success: true,
            data: { practice, questions }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.startPractice = startPractice;
const submitPracticeResponse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { questionId, answer, hintsUsed, timeSpent } = req.body;
        const question = await prisma_1.default.question.findUnique({ where: { id: questionId } });
        if (!question)
            throw new errorHandler_1.AppError('Question not found', 404);
        const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        const response = await prisma_1.default.practiceResponse.create({
            data: {
                practiceHistoryId: id,
                questionId,
                answer,
                isCorrect,
                hintsUsed: hintsUsed || 0,
                timeSpent
            }
        });
        // Update question success rate
        const allResponses = await prisma_1.default.practiceResponse.count({
            where: { questionId }
        });
        const correctResponses = await prisma_1.default.practiceResponse.count({
            where: { questionId, isCorrect: true }
        });
        await prisma_1.default.question.update({
            where: { id: questionId },
            data: { successRate: correctResponses / allResponses }
        });
        res.json({
            success: true,
            data: {
                ...response,
                isCorrect,
                explanation: question.explanation,
                correctAnswer: isCorrect ? null : question.correctAnswer
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitPracticeResponse = submitPracticeResponse;
const completePractice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const responses = await prisma_1.default.practiceResponse.findMany({
            where: { practiceHistoryId: id }
        });
        const correct = responses.filter(r => r.isCorrect).length;
        const total = responses.length;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;
        const xpEarned = correct * 5;
        const practice = await prisma_1.default.practiceHistory.update({
            where: { id },
            data: {
                completedAt: new Date(),
                questionsAttempted: total,
                questionsCorrect: correct,
                accuracy,
                xpEarned
            }
        });
        // Award XP
        await prisma_1.default.student.update({
            where: { id: user.student.id },
            data: { xp: { increment: xpEarned } }
        });
        res.json({
            success: true,
            data: { practice, accuracy, xpEarned }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completePractice = completePractice;
const getPracticeHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student)
            throw new errorHandler_1.AppError('Student not found', 404);
        const history = await prisma_1.default.practiceHistory.findMany({
            where: { studentId: user.student.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json({ success: true, data: history });
    }
    catch (error) {
        next(error);
    }
};
exports.getPracticeHistory = getPracticeHistory;
//# sourceMappingURL=practice.controller.js.map