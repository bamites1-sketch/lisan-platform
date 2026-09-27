"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildDetail = exports.getChildrenProgress = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getChildrenProgress = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                parent: {
                    include: {
                        children: {
                            include: {
                                readingProfiles: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 2
                                },
                                badges: true
                            }
                        }
                    }
                }
            }
        });
        if (!user || !user.parent)
            throw new errorHandler_1.AppError('Parent not found', 404);
        const children = user.parent.children.map(child => {
            const latest = child.readingProfiles[0];
            const previous = child.readingProfiles[1];
            const parse = (s) => {
                if (!s)
                    return [];
                try {
                    return JSON.parse(s);
                }
                catch {
                    return [];
                }
            };
            return {
                id: child.id,
                firstName: child.firstName,
                lastName: child.lastName,
                grade: child.grade,
                xp: child.xp,
                level: child.level,
                streakDays: child.streakDays,
                lastActiveAt: child.lastActiveAt,
                currentScore: latest?.readinessScore ?? 0,
                previousScore: previous?.readinessScore ?? 0,
                improvement: latest && previous ? latest.readinessScore - previous.readinessScore : 0,
                strengths: parse(latest?.strengths),
                weaknesses: parse(latest?.weaknesses),
                skillScores: {
                    phonemicAwareness: latest?.phonemicAwarenessScore ?? 0,
                    phonicsDecoding: latest?.phonicsDecodingScore ?? 0,
                    fluency: latest?.fluencyScore ?? 0,
                    vocabulary: latest?.vocabularyScore ?? 0,
                    comprehension: latest?.comprehensionScore ?? 0,
                },
                badges: child.badges,
                weeklyGoal: latest ? 'Practice your weakest skill 15 min/day' : undefined,
            };
        });
        res.json({ success: true, data: children });
    }
    catch (error) {
        next(error);
    }
};
exports.getChildrenProgress = getChildrenProgress;
const getChildDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { parent: true }
        });
        if (!user || !user.parent)
            throw new errorHandler_1.AppError('Parent not found', 404);
        const student = await prisma_1.default.student.findFirst({
            where: { id, parentId: user.parent.id },
            include: {
                readingProfiles: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                learningPlans: {
                    where: { status: 'active' },
                    include: {
                        weeks: {
                            include: {
                                activities: true
                            }
                        }
                    }
                },
                practiceHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 7
                },
                badges: true
            }
        });
        if (!student)
            throw new errorHandler_1.AppError('Child not found', 404);
        res.json({ success: true, data: student });
    }
    catch (error) {
        next(error);
    }
};
exports.getChildDetail = getChildDetail;
//# sourceMappingURL=parent.controller.js.map