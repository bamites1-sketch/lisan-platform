import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const getLearningPlan = async (
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

    const plan = await prisma.learningPlan.findFirst({
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
  } catch (error) {
    next(error);
  }
};

export const getLessons = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skillArea, grade } = req.query;

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(skillArea && { skillArea: skillArea as any }),
        ...(grade && { grade: grade as any })
      },
      orderBy: [{ skillArea: 'asc' }, { order: 'asc' }]
    });

    res.json({ success: true, data: lessons });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!lesson) throw new AppError('Lesson not found', 404);

    res.json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const completeActivity = async (
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

    const activity = await prisma.learningActivity.update({
      where: { id },
      data: { completed: true, completedAt: new Date() }
    });

    // Award XP
    await prisma.student.update({
      where: { id: user.student.id },
      data: { xp: { increment: 10 } }
    });

    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};
