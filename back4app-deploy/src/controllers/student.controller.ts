import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;

    // Get student with latest profile and learning plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            readingProfiles: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                learningPlan: {
                  include: {
                    weeks: {
                      include: {
                        activities: true
                      }
                    }
                  }
                }
              }
            },
            badges: {
              orderBy: { earnedAt: 'desc' }
            },
            assessments: {
              where: { status: { in: ['SUBMITTED', 'REVIEWED'] } },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const student = user.student;
    const latestProfile = student.readingProfiles[0];
    const latestAssessment = student.assessments[0];

    // Calculate dynamic target grade
    const currentGradeNum = parseInt(student.grade.replace('GRADE_', ''));
    const targetGradeNum = Math.min(currentGradeNum + 1, 12);
    const targetGrade = targetGradeNum === 12 ? 'Senior / College' : `Grade ${targetGradeNum}`;

    const skillScores = latestProfile ? {
      phonemicAwareness: latestProfile.phonemicAwarenessScore,
      phonicsDecoding: latestProfile.phonicsDecodingScore,
      fluency: latestProfile.fluencyScore,
      vocabulary: latestProfile.vocabularyScore,
      comprehension: latestProfile.comprehensionScore,
    } : null;

    const [assignmentRows, recentActivity] = await Promise.all([
      prisma.contentAssignment.findMany({
        where: { status: { not: 'archived' }, OR: [{ grade: student.grade }, { grade: 'ALL' }] },
        orderBy: { assignedAt: 'desc' },
        take: 5,
      }),
      prisma.progressLog.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);
    const assignments = await Promise.all(assignmentRows.map(async assignment => {
      const content = assignment.contentType === 'passage'
        ? await prisma.passage.findUnique({ where: { id: assignment.contentId }, select: { title: true } })
        : await prisma.lesson.findUnique({ where: { id: assignment.contentId }, select: { title: true } });
      return { ...assignment, contentTitle: content?.title ?? 'Assigned learning activity' };
    }));

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          xp: student.xp,
          level: student.level,
          streakDays: student.streakDays
        },
        readinessScore: latestProfile?.readinessScore || null,
        targetGrade,
        skillScores,
        latestProfile: latestProfile ? {
          id: latestProfile.id,
          readinessScore: latestProfile.readinessScore,
          strengths: latestProfile.strengths,
          weaknesses: latestProfile.weaknesses,
          priorities: latestProfile.priorities
        } : null,
        learningPlan: latestProfile?.learningPlan || null,
        badges: student.badges,
        hasCompletedAssessment: !!latestProfile || !!latestAssessment,
        assignments,
        recentActivity,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const updated = await prisma.student.update({
      where: { id: user.student.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName })
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getProgressLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
    if (!user?.student) throw new AppError('Student not found', 404);

    const logs = await prisma.progressLog.findMany({
      where: { studentId: user.student.id },
      orderBy: { date: 'asc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

// ─── Assignments (grade-filtered for the logged-in student) ──────────────────
export const getStudentAssignments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
    if (!user?.student) throw new AppError('Student not found', 404);

    const grade = user.student.grade; // e.g. "GRADE_6"

    // Return assignments that match this student's grade or are sent to ALL grades
    const assignments = await prisma.contentAssignment.findMany({
      where: {
        status: { not: 'archived' },
        OR: [{ grade }, { grade: 'ALL' }],
      },
      orderBy: { assignedAt: 'desc' },
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

export const getStudentClasses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { student: true } });
    if (!user?.student) throw new AppError('Student not found', 404);
    const classes = await prisma.classGroup.findMany({ where: { memberships: { some: { studentId: user.student.id } } }, include: { memberships: { include: { student: { select: { firstName: true, lastName: true } } } } }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: classes });
  } catch (error) { next(error); }
};

// ─── Student Content (filtered by published status, grade, and payment plan) ─────
export const getStudentContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { student: true } 
    });
    
    if (!user?.student) throw new AppError('Student not found', 404);

    const studentGrade = user.student.grade;
    const approvedPayment = await prisma.paymentSubmission.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { reviewedAt: 'desc' },
      select: { package: true },
    });
    const packageName = approvedPayment?.package.toUpperCase() ?? 'BASIC';
    const userPlan = packageName.includes('PREMIUM') ? 'PREMIUM' : packageName.includes('DIAGNOSTIC') ? 'DIAGNOSTIC' : 'BASIC';
    
    // Fetch all content types in parallel with individual filters
    const [lessons, passages, questions, vocabulary, pdfResources] = await Promise.all([
      prisma.lesson.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { requiredPlan: null },
            { requiredPlan: userPlan },
            ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
          ],
          AND: [
            {
              OR: [
                { assignedGrades: null },
                { assignedGrades: { contains: studentGrade } },
                { grade: studentGrade }
              ]
            }
          ]
        },
        orderBy: { order: 'asc' }
      }),
      prisma.passage.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { requiredPlan: null },
            { requiredPlan: userPlan },
            ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
          ],
          AND: [
            {
              OR: [
                { assignedGrades: null },
                { assignedGrades: { contains: studentGrade } },
                { grade: studentGrade }
              ]
            }
          ]
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.question.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { requiredPlan: null },
            { requiredPlan: userPlan },
            ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
          ],
          AND: [
            {
              OR: [
                { assignedGrades: null },
                { assignedGrades: { contains: studentGrade } },
                { grade: studentGrade }
              ]
            }
          ]
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vocabulary.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { requiredPlan: null },
            { requiredPlan: userPlan },
            ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
          ],
          AND: [
            {
              OR: [
                { assignedGrades: null },
                { assignedGrades: { contains: studentGrade } },
                { grade: studentGrade }
              ]
            }
          ]
        },
        orderBy: { word: 'asc' }
      }),
      prisma.pDFResource.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { requiredPlan: null },
            { requiredPlan: userPlan },
            ...(userPlan === 'PREMIUM' ? [{ requiredPlan: 'BASIC' }] : [])
          ],
          AND: [
            {
              OR: [
                { assignedGrades: null },
                { assignedGrades: { contains: studentGrade } },
                { grade: studentGrade }
              ]
            }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: {
        lessons,
        passages,
        questions,
        vocabulary,
        pdfResources,
        meta: {
          studentGrade,
          userPlan,
          totalContent: lessons.length + passages.length + questions.length + vocabulary.length + pdfResources.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get specific content by type and ID (with access control) ───────────────
export const getContentItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { type, id } = req.params;
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { student: true } 
    });
    
    if (!user?.student) throw new AppError('Student not found', 404);

    const studentGrade = user.student.grade;
    const userPlan = user.status;
    
    let content = null;
    
    // Fetch content based on type
    switch (type) {
      case 'lesson':
        content = await prisma.lesson.findUnique({ where: { id } });
        break;
      case 'passage':
        content = await prisma.passage.findUnique({ where: { id } });
        break;
      case 'question':
        content = await prisma.question.findUnique({ where: { id } });
        break;
      case 'vocabulary':
        content = await prisma.vocabulary.findUnique({ where: { id } });
        break;
      default:
        throw new AppError('Invalid content type', 400);
    }
    
    if (!content) {
      throw new AppError('Content not found', 404);
    }
    
    // Check access permissions
    const hasAccess = (
      content.status === 'PUBLISHED' &&
      (
        !content.requiredPlan || 
        content.requiredPlan === userPlan ||
        (userPlan === 'PREMIUM' && content.requiredPlan === 'BASIC') ||
        (user.status !== 'PENDING' && content.requiredPlan === 'DIAGNOSTIC')
      ) &&
      (
        !content.assignedGrades || 
        content.assignedGrades.includes(studentGrade)
      )
    );
    
    if (!hasAccess) {
      throw new AppError('Access denied to this content', 403);
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
};
