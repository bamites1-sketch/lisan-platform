import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Admin creates or updates Assessment Feedback for a student
 */
export const saveAssessmentFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminUserId = req.user!.userId;
    const {
      id,
      studentId,
      assessmentId,
      assessmentTitle,
      submissionId,
      overallScore,
      skillScores,
      problemAreas,
      weaknessesSummary,
      feedback,
      recommendations,
      recommendedLevel,
      actionPlan
    } = req.body;

    if (!studentId) {
      throw new AppError('Student ID is required', 400);
    }
    if (!assessmentTitle || !assessmentTitle.trim()) {
      throw new AppError('Assessment title is required', 400);
    }
    if (!feedback || !feedback.trim()) {
      throw new AppError('Assessment feedback commentary is required', 400);
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Get admin info
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      include: { admin: true }
    });
    const adminName = adminUser?.admin
      ? `${adminUser.admin.firstName} ${adminUser.admin.lastName}`.trim()
      : 'Admin';

    // Format fields
    const formattedSkillScores = skillScores ? (typeof skillScores === 'string' ? skillScores : JSON.stringify(skillScores)) : null;
    const formattedProblemAreas = problemAreas ? (typeof problemAreas === 'string' ? problemAreas : JSON.stringify(problemAreas)) : '[]';
    const formattedRecommendations = recommendations ? (typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations)) : '[]';

    let savedFeedback;
    if (id) {
      // Update existing
      savedFeedback = await prisma.assessmentFeedback.update({
        where: { id },
        data: {
          assessmentId: assessmentId || null,
          assessmentTitle: assessmentTitle.trim(),
          submissionId: submissionId || null,
          overallScore: overallScore !== undefined ? Number(overallScore) : null,
          skillScores: formattedSkillScores,
          problemAreas: formattedProblemAreas,
          weaknessesSummary: weaknessesSummary || null,
          feedback: feedback.trim(),
          recommendations: formattedRecommendations,
          recommendedLevel: recommendedLevel || null,
          actionPlan: actionPlan || null,
          createdByAdminId: adminUserId,
          adminName
        },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, grade: true }
          }
        }
      });
    } else {
      // Create new
      savedFeedback = await prisma.assessmentFeedback.create({
        data: {
          studentId,
          assessmentId: assessmentId || null,
          assessmentTitle: assessmentTitle.trim(),
          submissionId: submissionId || null,
          overallScore: overallScore !== undefined ? Number(overallScore) : null,
          skillScores: formattedSkillScores,
          problemAreas: formattedProblemAreas,
          weaknessesSummary: weaknessesSummary || null,
          feedback: feedback.trim(),
          recommendations: formattedRecommendations,
          recommendedLevel: recommendedLevel || null,
          actionPlan: actionPlan || null,
          createdByAdminId: adminUserId,
          adminName
        },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, grade: true }
          }
        }
      });
    }

    // Notify student
    try {
      await prisma.notification.create({
        data: {
          recipientId: student.userId,
          role: 'STUDENT',
          type: 'ASSESSMENT_FEEDBACK',
          title: '📋 Assessment Feedback Received',
          message: `Admin ${adminName} posted feedback for "${assessmentTitle.trim()}".`,
          icon: '📋',
          link: '/student/assessment-feedback'
        }
      });
    } catch (e) {
      console.error('Failed to notify student:', e);
    }

    res.status(id ? 200 : 210).json({
      success: true,
      message: 'Assessment feedback saved successfully',
      data: savedFeedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student retrieves their assessment feedbacks & recommendations
 */
export const getStudentAssessmentFeedbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const feedbacks = await prisma.assessmentFeedback.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    });

    // Parse JSON fields
    const parsedFeedbacks = feedbacks.map(item => {
      let parsedSkills = {};
      let parsedProblems: string[] = [];
      let parsedRecs: string[] = [];

      try { if (item.skillScores) parsedSkills = JSON.parse(item.skillScores); } catch {}
      try { if (item.problemAreas) parsedProblems = JSON.parse(item.problemAreas); } catch {}
      try { if (item.recommendations) parsedRecs = JSON.parse(item.recommendations); } catch {}

      return {
        ...item,
        skillScores: parsedSkills,
        problemAreas: parsedProblems,
        recommendations: parsedRecs
      };
    });

    // Calculate aggregated overview metrics
    const total = parsedFeedbacks.length;
    const scores = parsedFeedbacks.map(f => f.overallScore).filter((s): s is number => typeof s === 'number');
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    // Collect unique problem areas and active recommendations
    const allProblemAreas = Array.from(new Set(parsedFeedbacks.flatMap(f => f.problemAreas)));
    const allRecommendations = Array.from(new Set(parsedFeedbacks.flatMap(f => f.recommendations)));

    res.json({
      success: true,
      data: {
        feedbacks: parsedFeedbacks,
        stats: {
          totalAssessments: total,
          averageScore,
          problemAreasCount: allProblemAreas.length,
          recommendationsCount: allRecommendations.length,
          allProblemAreas,
          allRecommendations
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin retrieves all assessment feedbacks
 */
export const getAdminAssessmentFeedbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, grade, search } = req.query;

    const where: any = {};
    if (studentId && typeof studentId === 'string') {
      where.studentId = studentId;
    }
    if (grade && typeof grade === 'string' && grade !== 'ALL') {
      where.student = { grade };
    }

    const feedbacks = await prisma.assessmentFeedback.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
            user: { select: { email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse JSON fields
    let parsedFeedbacks = feedbacks.map(item => {
      let parsedSkills = {};
      let parsedProblems: string[] = [];
      let parsedRecs: string[] = [];

      try { if (item.skillScores) parsedSkills = JSON.parse(item.skillScores); } catch {}
      try { if (item.problemAreas) parsedProblems = JSON.parse(item.problemAreas); } catch {}
      try { if (item.recommendations) parsedRecs = JSON.parse(item.recommendations); } catch {}

      return {
        ...item,
        skillScores: parsedSkills,
        problemAreas: parsedProblems,
        recommendations: parsedRecs
      };
    });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      parsedFeedbacks = parsedFeedbacks.filter(f =>
        `${f.student.firstName} ${f.student.lastName}`.toLowerCase().includes(q) ||
        f.assessmentTitle.toLowerCase().includes(q) ||
        f.feedback.toLowerCase().includes(q) ||
        f.problemAreas.some((p: string) => p.toLowerCase().includes(q)) ||
        f.recommendations.some((r: string) => r.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      data: parsedFeedbacks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete assessment feedback
 */
export const deleteAssessmentFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await prisma.assessmentFeedback.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Assessment feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
