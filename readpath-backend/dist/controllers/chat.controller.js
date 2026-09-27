"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistory = exports.sendMessage = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const ai_service_1 = require("../services/ai.service");
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { message, context: additionalContext } = req.body;
        if (!message) {
            throw new errorHandler_1.AppError('Message is required', 400);
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                student: {
                    include: {
                        readingProfiles: {
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
        // Save user message
        await prisma_1.default.chatMessage.create({
            data: {
                studentId: student.id,
                role: 'user',
                message,
                context: additionalContext
            }
        });
        // Get recent chat history for context
        const recentHistory = await prisma_1.default.chatMessage.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const chatHistory = recentHistory
            .reverse()
            .slice(0, -1) // Exclude the message we just created
            .map(msg => ({
            role: msg.role,
            content: msg.message
        }));
        // Add current message
        chatHistory.push({ role: 'user', content: message });
        // Build student context
        const weaknesses = latestProfile?.weaknesses ? JSON.parse(latestProfile.weaknesses) : [];
        const priorities = latestProfile?.priorities ? JSON.parse(latestProfile.priorities) : [];
        const studentContext = {
            firstName: student.firstName,
            grade: student.grade,
            readinessScore: latestProfile?.readinessScore,
            weaknesses: Array.isArray(weaknesses) ? weaknesses.map(w => typeof w === 'string' ? w : w.skill) : [],
            priorities: Array.isArray(priorities) ? priorities : [],
            currentLesson: additionalContext?.currentLesson
        };
        // Get AI response
        const aiResponse = await (0, ai_service_1.getTutorResponse)(chatHistory, studentContext);
        // Save AI response
        const savedResponse = await prisma_1.default.chatMessage.create({
            data: {
                studentId: student.id,
                role: 'assistant',
                message: aiResponse.text
            }
        });
        res.json({
            success: true,
            data: {
                message: aiResponse.text,
                messageId: savedResponse.id,
                provider: aiResponse.provider
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessage = sendMessage;
const getChatHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const history = await prisma_1.default.chatMessage.findMany({
            where: { studentId: user.student.id },
            orderBy: { createdAt: 'asc' },
            take: 50 // Last 50 messages
        });
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatHistory = getChatHistory;
//# sourceMappingURL=chat.controller.js.map