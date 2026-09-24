import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const getChildrenProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
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

    if (!user || !user.parent) throw new AppError('Parent not found', 404);

    const children = user.parent.children.map(child => {
      const latest   = child.readingProfiles[0];
      const previous = child.readingProfiles[1];

      const parse = (s: string | null | undefined): string[] => {
        if (!s) return [];
        try { return JSON.parse(s); } catch { return []; }
      };

      return {
        id:            child.id,
        firstName:     child.firstName,
        lastName:      child.lastName,
        grade:         child.grade,
        xp:            child.xp,
        level:         child.level,
        streakDays:    child.streakDays,
        lastActiveAt:  child.lastActiveAt,
        currentScore:  latest?.readinessScore  ?? 0,
        previousScore: previous?.readinessScore ?? 0,
        improvement:   latest && previous ? latest.readinessScore - previous.readinessScore : 0,
        strengths:     parse(latest?.strengths),
        weaknesses:    parse(latest?.weaknesses),
        skillScores: {
          phonemicAwareness: latest?.phonemicAwarenessScore ?? 0,
          phonicsDecoding:   latest?.phonicsDecodingScore   ?? 0,
          fluency:           latest?.fluencyScore           ?? 0,
          vocabulary:        latest?.vocabularyScore        ?? 0,
          comprehension:     latest?.comprehensionScore     ?? 0,
        },
        badges:      child.badges,
        weeklyGoal:  latest ? 'Practice your weakest skill 15 min/day' : undefined,
      };
    });

    res.json({ success: true, data: children });
  } catch (error) {
    next(error);
  }
};

export const getChildDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { parent: true }
    });

    if (!user || !user.parent) throw new AppError('Parent not found', 404);

    const student = await prisma.student.findFirst({
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

    if (!student) throw new AppError('Child not found', 404);

    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};
