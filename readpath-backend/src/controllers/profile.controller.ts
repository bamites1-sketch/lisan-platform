import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const getReadingProfile = async (
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

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const profile = await prisma.readingProfile.findFirst({
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
  } catch (error) {
    next(error);
  }
};

export const getProfileHistory = async (
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

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const profiles = await prisma.readingProfile.findMany({
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
  } catch (error) {
    next(error);
  }
};
