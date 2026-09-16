import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const getStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
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

    if (!user || !user.teacher) throw new AppError('Teacher not found', 404);

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
  } catch (error) {
    next(error);
  }
};

export const getStudentDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true }
    });

    if (!user || !user.teacher) throw new AppError('Teacher not found', 404);

    const student = await prisma.student.findFirst({
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

    if (!student) throw new AppError('Student not found', 404);

    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

export const getClassAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: { include: { students: { include: { readingProfiles: { orderBy: { createdAt: 'desc' }, take: 1 } } } } } }
    });

    if (!user || !user.teacher) throw new AppError('Teacher not found', 404);

    const students = user.teacher.students;
    const profiles = students.map(s => s.readingProfiles[0]).filter(Boolean);

    const avgScore = profiles.length > 0
      ? Math.round(profiles.reduce((sum, p) => sum + p!.readinessScore, 0) / profiles.length)
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
  } catch (error) {
    next(error);
  }
};


