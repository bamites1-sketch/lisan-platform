"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileHistory = exports.getReadingProfile = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getReadingProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const profile = await prisma_1.default.readingProfile.findFirst({
            where: { studentId: user.student.id },
            orderBy: { createdAt: 'desc' },
            include: {
                learningPlan: {
                    include: { weeks: { include: { activities: true } } }
                }
            }
        });
        if (!profile) {
            return res.json({ success: true, data: null });
        }
        res.json({ success: true, data: profile });
    }
    catch (error) {
        next(error);
    }
};
exports.getReadingProfile = getReadingProfile;
const getProfileHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user || !user.student) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const profiles = await prisma_1.default.readingProfile.findMany({
            where: { studentId: user.student.id },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                readinessScore: true,
                phonemicAwarenessScore: true,
                phonicsDecodingScore: true,
                fluencyScore: true,
                vocabularyScore: true,
                comprehensionScore: true,
                createdAt: true
            }
        });
        res.json({ success: true, data: profiles });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfileHistory = getProfileHistory;
//# sourceMappingURL=profile.controller.js.map