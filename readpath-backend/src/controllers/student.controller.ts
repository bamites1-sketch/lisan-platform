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

    const [assignmentRows, recentActivity, pendingAssessments] = await Promise.all([
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
      prisma.assessmentSubmission.findMany({
        where: { studentId: student.id, status: 'IN_PROGRESS' },
        include: { assessment: true },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const resolvedContent = await Promise.all(assignmentRows.map(async assignment => {
      const content = assignment.contentType === 'passage'
        ? await prisma.passage.findUnique({ where: { id: assignment.contentId }, select: { title: true } })
        : await prisma.lesson.findUnique({ where: { id: assignment.contentId }, select: { title: true } });
      return { ...assignment, contentTitle: content?.title ?? 'Assigned learning activity' };
    }));

    const resolvedAssessments = pendingAssessments.map(sub => ({
      id: sub.id,
      contentType: 'assessment',
      contentId: sub.assessmentId,
      grade: sub.assessment.grade,
      assignedAt: sub.createdAt,
      status: 'active',
      contentTitle: sub.assessment.title
    }));

    const assignments = [...resolvedAssessments, ...resolvedContent];

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

    // 1. Fetch content assignments for student's grade or ALL grades
    const contentAssignments = await prisma.contentAssignment.findMany({
      where: {
        status: { not: 'archived' },
        OR: [{ grade }, { grade: 'ALL' }],
      },
      orderBy: { assignedAt: 'desc' },
    });

    // 2. Fetch assigned assessments (both active submissions and assigned assessments)
    const assignedAssessments = await prisma.assessmentSubmission.findMany({
      where: {
        studentId: user.student.id,
        status: { in: ['IN_PROGRESS', 'SUBMITTED', 'REVIEWED'] }
      },
      include: {
        assessment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Resolve details for content assignments
    const resolvedContentAssignments = await Promise.all(
      contentAssignments.map(async item => {
        let contentDetails: any = null;
        let title = 'Assigned Learning Activity';

        if (item.contentType === 'passage') {
          const passage = await prisma.passage.findUnique({
            where: { id: item.contentId },
            select: { id: true, title: true, topic: true, difficulty: true, wordCount: true, grade: true, content: true }
          });
          if (passage) {
            title = passage.title;
            contentDetails = {
              title: passage.title,
              topic: passage.topic,
              difficulty: passage.difficulty,
              wordCount: passage.wordCount,
              grade: passage.grade,
              preview: passage.content.slice(0, 140) + '...'
            };
          }
        } else if (item.contentType === 'lesson') {
          const lesson = await prisma.lesson.findUnique({
            where: { id: item.contentId },
            select: { id: true, title: true, skillArea: true, subskill: true, difficulty: true, grade: true, explanation: true }
          });
          if (lesson) {
            title = lesson.title;
            contentDetails = {
              title: lesson.title,
              skillArea: lesson.skillArea,
              subskill: lesson.subskill,
              difficulty: lesson.difficulty,
              grade: lesson.grade,
              preview: lesson.explanation.slice(0, 140) + '...'
            };
          }
        }

        return {
          id: item.id,
          contentType: item.contentType,
          contentId: item.contentId,
          title,
          grade: item.grade,
          assignedAt: item.assignedAt.toISOString(),
          dueDate: item.dueDate ? item.dueDate.toISOString() : null,
          note: item.note,
          status: item.status,
          assignedBy: item.assignedBy,
          details: contentDetails
        };
      })
    );

    // 4. Format assessment items to unify assignment display
    const formattedAssessments = assignedAssessments.map(sub => {
      let skillAreasParsed: string[] = [];
      try {
        skillAreasParsed = JSON.parse(sub.assessment.skillAreas || '[]');
      } catch {
        skillAreasParsed = [];
      }

      return {
        id: `assessment-${sub.id}`,
        contentType: 'assessment',
        contentId: sub.assessmentId,
        submissionId: sub.id,
        title: sub.assessment.title,
        grade: sub.assessment.grade,
        assignedAt: sub.createdAt.toISOString(),
        dueDate: null,
        note: sub.assessment.description || sub.assessment.instructions,
        status: sub.status === 'IN_PROGRESS' ? 'active' : 'completed',
        submissionStatus: sub.status,
        overallScore: sub.overallScore,
        details: {
          title: sub.assessment.title,
          passage: sub.assessment.passage,
          skillAreas: skillAreasParsed,
          instructions: sub.assessment.instructions,
          status: sub.status,
          overallScore: sub.overallScore
        }
      };
    });

    res.json({
      success: true,
      data: [...resolvedContentAssignments, ...formattedAssessments]
    });
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

// ─── Student Resources (Study Materials, Worksheets, Guides) ────────────────
export const getStudentResources = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    const studentGrade = user?.student?.grade || '';

    const resources = await prisma.pDFResource.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { grade: 'ALL' },
          { grade: studentGrade },
          { assignedGrades: null },
          { assignedGrades: { contains: studentGrade } },
          { assignedGrades: { contains: 'ALL' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: resources });
  } catch (error) {
    next(error);
  }
};

export const getStudentResourceDownloadUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const resource = await prisma.pDFResource.findUnique({ where: { id } });
    if (!resource) throw new AppError('Resource not found', 404);
    if (!resource.fileUrl) throw new AppError('No file available', 404);

    await prisma.pDFResource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    if (resource.fileUrl.startsWith('data:') || resource.fileUrl.startsWith('http://') || resource.fileUrl.startsWith('https://')) {
      return res.json({
        success: true,
        data: {
          url: resource.fileUrl,
          downloadUrl: resource.fileUrl,
          fileName: resource.fileName,
          fileType: resource.fileType
        }
      });
    }

    try {
      const { getSignedDownloadUrl, isR2Configured } = await import('../lib/r2storage');
      if (isR2Configured()) {
        const signedUrl = await getSignedDownloadUrl(resource.fileUrl, 3600);
        return res.json({
          success: true,
          data: {
            url: signedUrl,
            downloadUrl: signedUrl,
            fileName: resource.fileName,
            fileType: resource.fileType
          }
        });
      }
    } catch (e) {
      console.warn('[getStudentResourceDownloadUrl] R2 error:', e);
    }

    const { getLocalUrl } = await import('../lib/localStorage');
    const localUrl = getLocalUrl(resource.fileUrl);
    return res.json({
      success: true,
      data: {
        url: localUrl || resource.fileUrl,
        downloadUrl: localUrl || resource.fileUrl,
        fileName: resource.fileName,
        fileType: resource.fileType
      }
    });
  } catch (error) {
    next(error);
  }
};
