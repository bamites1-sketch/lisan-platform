import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification, broadcastToRole } from './notification.controller';
import multer from 'multer';
import { uploadToR2, FileCategory } from '../lib/r2storage';

// Configure multer for audio uploads (memory storage for R2)
export const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // Technical storage safeguard; no short recording duration limit.
  }
});

// ============================================================================
// ADMIN ENDPOINTS - Create and Manage Assessments
// ============================================================================

export const createAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, passage, grade, skillAreas, instructions } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!title || !passage || !grade) {
      throw new AppError('Title, passage, and grade are required', 400);
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        passage,
        grade,
        skillAreas: JSON.stringify(skillAreas || ['fluency', 'accuracy', 'comprehension']),
        instructions,
        status: 'DRAFT',
        createdBy: userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, grade, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (grade) where.grade = grade;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          assignments: {
            select: {
              id: true,
              assignmentType: true,
              targetGrade: true,
              dueDate: true,
              status: true
            }
          },
          submissions: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              overallScore: true,
              student: {
                select: { firstName: true, lastName: true, grade: true }
              }
            }
          },
          _count: {
            select: {
              assignments: true,
              submissions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.assessment.count({ where })
    ]);

    // Calculate statistics for each assessment
    const assessmentsWithStats = assessments.map(assessment => {
      const submittedCount = assessment.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'REVIEWED').length;
      const reviewedCount = assessment.submissions.filter(s => s.status === 'REVIEWED').length;
      const avgScore = assessment.submissions
        .filter(s => s.overallScore !== null)
        .reduce((sum, s, _, arr) => sum + (s.overallScore || 0) / arr.length, 0);

      return {
        ...assessment,
        stats: {
          totalAssigned: assessment._count.assignments,
          totalSubmissions: assessment._count.submissions,
          submittedCount,
          reviewedCount,
          pendingReview: submittedCount - reviewedCount,
          averageScore: reviewedCount > 0 ? Math.round(avgScore) : null
        }
      };
    });

    res.json({
      success: true,
      data: {
        assessments: assessmentsWithStats,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          total,
          limit: parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        assignments: true,
        submissions: {
          include: {
            student: {
              select: { firstName: true, lastName: true, grade: true }
            }
          }
        }
      }
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, passage, grade, skillAreas, instructions, status } = req.body;

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        title,
        description,
        passage,
        grade,
        skillAreas: skillAreas ? JSON.stringify(skillAreas) : undefined,
        instructions,
        status
      }
    });

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if assessment has submissions
    const submissionsCount = await prisma.assessmentSubmission.count({
      where: { assessmentId: id }
    });

    if (submissionsCount > 0) {
      throw new AppError('Cannot delete assessment with existing submissions', 400);
    }

    await prisma.assessment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all students for assignment dropdown
export const getStudentsForAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { grade } = req.query;
    
    const where: any = {};
    if (grade) where.grade = grade;

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        grade: true,
        user: {
          select: { email: true, status: true }
        }
      },
      orderBy: [
        { grade: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Only return active students
    const activeStudents = students.filter(s => s.user.status === 'ACTIVE');

    res.json({
      success: true,
      data: activeStudents
    });
  } catch (error) {
    next(error);
  }
};

// Get all teachers for class assignment
export const getTeachersForAssignment = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: {
          select: { email: true, status: true }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Only return active teachers
    const activeTeachers = teachers.filter(t => t.user.status === 'ACTIVE');

    res.json({
      success: true,
      data: activeTeachers
    });
  } catch (error) {
    next(error);
  }
};

// Get available grades for grade-level assignment
export const getGradesForAssignment = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const grades = await prisma.student.groupBy({
      by: ['grade'],
      _count: {
        grade: true
      },
      where: {
        user: {
          status: 'ACTIVE'
        }
      },
      orderBy: {
        grade: 'asc'
      }
    });

    res.json({
      success: true,
      data: grades.map(g => ({
        grade: g.grade,
        studentCount: g._count.grade
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const assignAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { assignmentType, targetIds, targetGrade, dueDate } = req.body;

    // Validate assessment exists and is published
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    if (assessment.status !== 'PUBLISHED') {
      throw new AppError('Assessment must be published before assignment', 400);
    }

    // Validate assignment type and targets
    if (!['ALL', 'PLAN', 'INDIVIDUAL', 'CLASS', 'GRADE'].includes(assignmentType)) {
      throw new AppError('Invalid assignment type', 400);
    }

    let targetStudents: any[] = [];

    if (assignmentType === 'ALL') {
      targetStudents = await prisma.student.findMany({
        where: { user: { status: 'ACTIVE' } },
        include: { user: true }
      });
    } else if (assignmentType === 'PLAN') {
      if (!targetGrade) throw new AppError('Plan is required for plan assignment', 400);
      targetStudents = await prisma.student.findMany({
        where: {
          user: {
            status: 'ACTIVE',
            paymentSubmissions: { some: { status: 'APPROVED', package: { contains: targetGrade } } }
          }
        },
        include: { user: true }
      });
    } else if (assignmentType === 'INDIVIDUAL') {
      if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
        throw new AppError('Student IDs are required for individual assignment', 400);
      }
      
      targetStudents = await prisma.student.findMany({
        where: { id: { in: targetIds } },
        include: { user: true }
      });
      
      if (targetStudents.length !== targetIds.length) {
        throw new AppError('Some student IDs are invalid', 400);
      }
    } else if (assignmentType === 'CLASS') {
      if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
        throw new AppError('Class groups are required for class assignment', 400);
      }

      targetStudents = await prisma.student.findMany({
        where: { teacherId: { in: targetIds } },
        include: { user: true }
      });
    } else if (assignmentType === 'GRADE') {
      if (!targetGrade) {
        throw new AppError('Target grade is required for grade assignment', 400);
      }

      targetStudents = await prisma.student.findMany({
        where: { grade: targetGrade },
        include: { user: true }
      });
    }

    if (targetStudents.length === 0) {
      throw new AppError('No students found for the specified assignment criteria', 400);
    }

    // Create assignment record
    const assignment = await prisma.assessmentAssignment.create({
      data: {
        assessmentId: id,
        assignmentType,
        targetId: assignmentType === 'INDIVIDUAL' ? targetIds?.[0] : 
                  assignmentType === 'CLASS' ? targetIds?.[0] : null,
        targetGrade: assignmentType === 'GRADE' ? targetGrade : null,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    // Check for existing submissions to avoid duplicates
    const existingSubmissions = await prisma.assessmentSubmission.findMany({
      where: {
        assessmentId: id,
        studentId: { in: targetStudents.map(s => s.id) }
      },
      select: { studentId: true }
    });

    const existingStudentIds = new Set(existingSubmissions.map(s => s.studentId));
    const newStudents = targetStudents.filter(s => !existingStudentIds.has(s.id));

    // Create submission records for new students only
    const submissions = await Promise.all(
      newStudents.map(student => 
        prisma.assessmentSubmission.create({
          data: {
            assessmentId: id,
            studentId: student.id,
            status: 'IN_PROGRESS'
          }
        })
      )
    );

    // Send notifications to new students only
    await Promise.all(
      newStudents.map(student =>
        createNotification({
          recipientId: student.user.id,
          role: 'STUDENT',
          type: 'new_assessment',
          title: 'New Reading Assessment',
          message: `You have been assigned a new reading assessment: "${assessment.title}"`,
          icon: '📝',
          link: `/student/assessments/${id}`,
          meta: { 
            assessmentId: id, 
            assessmentTitle: assessment.title,
            dueDate: assignment.dueDate?.toISOString() || ''
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Assessment assigned to ${newStudents.length} new student(s). ${existingStudentIds.size} students already had this assessment.`,
      data: { 
        assignment, 
        newSubmissions: submissions.length,
        totalTargeted: targetStudents.length,
        alreadyAssigned: existingStudentIds.size
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STUDENT ENDPOINTS - View and Submit Assessments
// ============================================================================

export const getStudentAssessments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const where: any = { studentId: user.student.id };
    if (status) where.status = status;

    const submissions = await prisma.assessmentSubmission.findMany({
      where,
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            passage: true,
            grade: true,
            skillAreas: true,
            instructions: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group assessments by status for easier frontend handling
    const grouped = {
      pending: submissions.filter(s => s.status === 'IN_PROGRESS'),
      submitted: submissions.filter(s => s.status === 'SUBMITTED'),
      reviewed: submissions.filter(s => s.status === 'REVIEWED')
    };

    res.json({
      success: true,
      data: {
        all: submissions,
        grouped,
        counts: {
          pending: grouped.pending.length,
          submitted: grouped.submitted.length,
          reviewed: grouped.reviewed.length,
          total: submissions.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentForStudent = async (
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

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const submission = await prisma.assessmentSubmission.findFirst({
      where: {
        assessmentId: id,
        studentId: user.student.id
      },
      include: {
        assessment: true
      }
    });

    if (!submission) {
      throw new AppError('Assessment not assigned to this student', 404);
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssessmentRecording = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // assessment ID
    const { duration } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    // Find the submission
    const submission = await prisma.assessmentSubmission.findFirst({
      where: {
        assessmentId: id,
        studentId: user.student.id
      },
      include: {
        assessment: true
      }
    });

    if (!submission) {
      throw new AppError('Assessment submission not found', 404);
    }

    if (submission.status !== 'IN_PROGRESS') {
      throw new AppError('Assessment has already been submitted', 400);
    }

    // Upload audio to R2
    let audioKey: string | null = null;
    if (req.file) {
      const result = await uploadToR2(req.file, FileCategory.RECORDING);
      audioKey = result.key;
    }

    if (!audioKey) {
      throw new AppError('Audio file is required', 400);
    }

    // Update submission
    const updatedSubmission = await prisma.assessmentSubmission.update({
      where: { id: submission.id },
      data: {
        audioUrl: audioKey,
        duration: duration ? parseInt(duration) : null,
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        assessment: true,
        student: {
          include: { user: true }
        }
      }
    });

    // Notify admins and teachers about new submission
    const studentName = `${updatedSubmission.student.firstName} ${updatedSubmission.student.lastName}`;
    
    await broadcastToRole('ADMIN', {
      type: 'new_recording',
      title: 'New Assessment Submission',
      message: `${studentName} submitted a recording for "${updatedSubmission.assessment.title}"`,
      icon: '🎤',
      link: `/admin/assessments/${updatedSubmission.assessmentId}/submissions/${updatedSubmission.id}`,
      meta: {
        submissionId: updatedSubmission.id,
        assessmentId: updatedSubmission.assessmentId,
        studentId: updatedSubmission.studentId,
        studentName,
        submittedAt: updatedSubmission.submittedAt?.toISOString() || ''
      }
    });

    // Notify student's teacher if assigned
    if (updatedSubmission.student.teacherId) {
      const teacherUser = await prisma.user.findFirst({
        where: { teacher: { id: updatedSubmission.student.teacherId } }
      });

      if (teacherUser) {
        await createNotification({
          recipientId: teacherUser.id,
          role: 'TEACHER',
          type: 'new_recording',
          title: 'New Assessment Submission',
          message: `${studentName} submitted a recording for "${updatedSubmission.assessment.title}"`,
          icon: '🎤',
          link: `/teacher/assessments/${updatedSubmission.assessmentId}/review/${updatedSubmission.id}`,
          meta: {
            submissionId: updatedSubmission.id,
            assessmentId: updatedSubmission.assessmentId,
            studentId: updatedSubmission.studentId,
            studentName,
            submittedAt: updatedSubmission.submittedAt?.toISOString() || ''
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Assessment recording submitted successfully',
      data: updatedSubmission
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN/TEACHER ENDPOINTS - Review and Score Submissions
// ============================================================================

export const getSubmissionsForReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status = 'SUBMITTED', assessmentId, studentId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (assessmentId) where.assessmentId = assessmentId;
    if (studentId) where.studentId = studentId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [submissions, total] = await Promise.all([
      prisma.assessmentSubmission.findMany({
        where,
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              passage: true,
              grade: true,
              skillAreas: true,
              instructions: true
            }
          },
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              grade: true,
              user: {
                select: { email: true }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.assessmentSubmission.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          total,
          limit: parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubmissionForReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id },
      include: {
        assessment: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: true
          }
        }
      }
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

export const scoreSubmission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      overallScore,
      fluencyScore,
      accuracyScore,
      comprehensionScore,
      phonemicAwarenessScore,
      phonicsDecodingScore,
      vocabularyScore,
      wordsPerMinute,
      correctWordsPerMinute,
      correctWords,
      totalWords,
      strengths,
      weaknesses,
      feedback,
      recommendations,
      recommendedNextLevel,
      intervention
    } = req.body;

    const reviewerId = req.user!.userId;

    // Validate required fields
    if (overallScore === undefined || overallScore < 0 || overallScore > 100) {
      throw new AppError('Overall score is required and must be between 0 and 100', 400);
    }

    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id },
      include: {
        assessment: true,
        student: {
          include: { user: true }
        }
      }
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    if (submission.status !== 'SUBMITTED') {
      throw new AppError('Submission must be in SUBMITTED status to be reviewed', 400);
    }

    // Update submission with scores and feedback
    const updatedSubmission = await prisma.assessmentSubmission.update({
      where: { id },
      data: {
        status: 'REVIEWED',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        overallScore,
        fluencyScore,
        accuracyScore,
        comprehensionScore,
        phonemicAwarenessScore,
        phonicsDecodingScore,
        vocabularyScore,
        wordsPerMinute,
        correctWordsPerMinute,
        correctWords,
        totalWords,
        strengths: strengths ? JSON.stringify(strengths) : null,
        weaknesses: weaknesses ? JSON.stringify(weaknesses) : null,
        feedback,
        recommendations: recommendations ? JSON.stringify(recommendations) : null,
        recommendedNextLevel,
        intervention
      },
      include: {
        assessment: true,
        student: {
          include: { user: true }
        }
      }
    });

    // Create or update reading profile if comprehensive scores provided
    if (fluencyScore !== undefined && accuracyScore !== undefined && comprehensionScore !== undefined) {
      await prisma.readingProfile.upsert({
        where: { assessmentSubmissionId: id },
        update: {
          readinessScore: overallScore,
          currentGrade: submission.student.grade,
          targetGrade: submission.assessment.grade,
          phonemicAwarenessScore: accuracyScore,
          phonicsDecodingScore: accuracyScore,
          fluencyScore,
          vocabularyScore: vocabularyScore ?? comprehensionScore,
          comprehensionScore,
          strengths: strengths ? JSON.stringify(strengths) : '[]',
          weaknesses: weaknesses ? JSON.stringify(weaknesses) : '[]',
          priorities: '[]',
          recommendations: recommendations ? JSON.stringify(recommendations) : '[]'
        },
        create: {
          studentId: submission.studentId,
          assessmentSubmissionId: id,
          readinessScore: overallScore,
          currentGrade: submission.student.grade,
          targetGrade: submission.assessment.grade,
          phonemicAwarenessScore: accuracyScore,
          phonicsDecodingScore: accuracyScore,
          fluencyScore,
          vocabularyScore: vocabularyScore ?? comprehensionScore,
          comprehensionScore,
          strengths: strengths ? JSON.stringify(strengths) : '[]',
          weaknesses: weaknesses ? JSON.stringify(weaknesses) : '[]',
          priorities: '[]',
          recommendations: recommendations ? JSON.stringify(recommendations) : '[]'
        }
      });
    }

    // Notify student that their assessment has been reviewed
    const _studentName = `${updatedSubmission.student.firstName} ${updatedSubmission.student.lastName}`;
    await createNotification({
      recipientId: submission.student.user.id,
      role: 'STUDENT',
      type: 'assessment_reviewed',
      title: 'Assessment Results Available',
      message: `Your reading assessment "${submission.assessment.title}" has been reviewed. Score: ${overallScore}/100`,
      icon: '📊',
      link: `/student/assessments/${submission.assessmentId}/result/${id}`,
      meta: {
        submissionId: id,
        assessmentId: submission.assessmentId,
        score: overallScore,
        assessmentTitle: submission.assessment.title,
        reviewedAt: updatedSubmission.reviewedAt?.toISOString() || '',
        reviewedBy: reviewerId
      }
    });

    res.json({
      success: true,
      message: 'Assessment scored and feedback provided successfully',
      data: updatedSubmission
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentAssessmentHistory = async (
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

    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        studentId: user.student.id,
        status: 'REVIEWED'
      },
      include: {
        assessment: {
          select: {
            title: true,
            description: true,
            grade: true
          }
        }
      },
      orderBy: { reviewedAt: 'desc' }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assessmentId, submissionId } = req.params;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user || !user.student) {
      throw new AppError('Student not found', 404);
    }

    const submission = await prisma.assessmentSubmission.findFirst({
      where: {
        id: submissionId,
        assessmentId: assessmentId,
        studentId: user.student.id,
        status: 'REVIEWED'
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            passage: true,
            grade: true,
            skillAreas: true,
            instructions: true
          }
        },
        readingProfile: true
      }
    });

    if (!submission) {
      throw new AppError('Assessment result not found or not yet reviewed', 404);
    }

    // Parse JSON fields
    const result = {
      ...submission,
      strengths: submission.strengths ? JSON.parse(submission.strengths) : [],
      weaknesses: submission.weaknesses ? JSON.parse(submission.weaknesses) : [],
      recommendations: submission.recommendations ? JSON.parse(submission.recommendations) : [],
      skillAreas: submission.assessment.skillAreas ? JSON.parse(submission.assessment.skillAreas) : []
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};