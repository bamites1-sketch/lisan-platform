import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const startPractice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { skillArea } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) throw new AppError('Student not found', 404);

    const practice = await prisma.practiceHistory.create({
      data: {
        studentId: user.student.id,
        skillArea
      }
    });

    // Get adaptive questions for this skill area
    const questions = await prisma.question.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const submitPracticeResponse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { questionId, answer, hintsUsed, timeSpent } = req.body;

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new AppError('Question not found', 404);

    const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

    const response = await prisma.practiceResponse.create({
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
    const allResponses = await prisma.practiceResponse.count({
      where: { questionId }
    });
    const correctResponses = await prisma.practiceResponse.count({
      where: { questionId, isCorrect: true }
    });
    await prisma.question.update({
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
  } catch (error) {
    next(error);
  }
};

export const completePractice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) throw new AppError('Student not found', 404);

    const responses = await prisma.practiceResponse.findMany({
      where: { practiceHistoryId: id }
    });

    const correct = responses.filter(r => r.isCorrect).length;
    const total = responses.length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const xpEarned = correct * 5;

    const practice = await prisma.practiceHistory.update({
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
    await prisma.student.update({
      where: { id: user.student.id },
      data: { xp: { increment: xpEarned } }
    });

    res.json({
      success: true,
      data: { practice, accuracy, xpEarned }
    });
  } catch (error) {
    next(error);
  }
};

export const getPracticeHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) throw new AppError('Student not found', 404);

    const history = await prisma.practiceHistory.findMany({
      where: { studentId: user.student.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
