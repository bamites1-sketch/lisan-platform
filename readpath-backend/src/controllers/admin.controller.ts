import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification, broadcastToRole } from './notification.controller';
import multer from 'multer';

// ─── File Upload Configuration (Memory Storage for R2) ────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

export const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [totalStudents, totalTeachers, totalParents, completedAssessments, profiles] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.assessment.count({ where: { status: 'COMPLETED' } }),
      prisma.readingProfile.findMany({
        select: {
          readinessScore: true,
          phonemicAwarenessScore: true,
          phonicsDecodingScore: true,
          fluencyScore: true,
          vocabularyScore: true,
          comprehensionScore: true
        }
      })
    ]);

    const avgReadiness = profiles.length > 0
      ? Math.round(profiles.reduce((s, p) => s + p.readinessScore, 0) / profiles.length)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalTeachers,
          totalParents,
          completedAssessments,
          avgReadinessScore: avgReadiness
        },
        skillAverages: {
          phonemicAwareness: Math.round(profiles.reduce((s, p) => s + p.phonemicAwarenessScore, 0) / (profiles.length || 1)),
          phonicsDecoding: Math.round(profiles.reduce((s, p) => s + p.phonicsDecodingScore, 0) / (profiles.length || 1)),
          fluency: Math.round(profiles.reduce((s, p) => s + p.fluencyScore, 0) / (profiles.length || 1)),
          vocabulary: Math.round(profiles.reduce((s, p) => s + p.vocabularyScore, 0) / (profiles.length || 1)),
          comprehension: Math.round(profiles.reduce((s, p) => s + p.comprehensionScore, 0) / (profiles.length || 1))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        student: true,
        parent: true,
        teacher: true,
        admin: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        profile: u.student || u.parent || u.teacher || u.admin
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const createContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, data } = req.body;

    let result;
    
    // If data has an id, it's an update operation
    if (data.id) {
      switch (type) {
        case 'passage':
          result = await prisma.passage.update({
            where: { id: data.id },
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
              updatedAt: new Date()
            }
          });
          break;
        case 'question':
          result = await prisma.question.update({
            where: { id: data.id },
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
              updatedAt: new Date()
            }
          });
          break;
        case 'vocabulary':
          result = await prisma.vocabulary.update({
            where: { id: data.id },
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
              updatedAt: new Date()
            }
          });
          break;
        case 'lesson':
          result = await prisma.lesson.update({
            where: { id: data.id },
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
              updatedAt: new Date()
            }
          });
          break;
        case 'assessment':
          result = await prisma.assessment.update({
            where: { id: data.id },
            data: {
              title: data.title,
              description: data.description,
              passage: data.passage || '',
              grade: data.grade,
              skillAreas: data.skillAreas || '[]',
              instructions: data.instructions,
              status: data.status || 'DRAFT',
              updatedAt: new Date()
            }
          });
          break;
        case 'pdf-resource':
          result = await prisma.pDFResource.update({
            where: { id: data.id },
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
              updatedAt: new Date()
            }
          });
          break;
        default:
          throw new AppError('Invalid content type', 400);
      }
    } else {
      // Create new content
      switch (type) {
        case 'passage':
          result = await prisma.passage.create({ 
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
            }
          });
          break;
        case 'question':
          result = await prisma.question.create({ 
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
            }
          });
          break;
        case 'vocabulary':
          result = await prisma.vocabulary.create({ 
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
            }
          });
          break;
        case 'lesson':
          result = await prisma.lesson.create({ 
            data: {
              ...data,
              examples: data.examples || '[]',
              demonstrationSteps: data.demonstrationSteps || '[]',
              guidedPractice: data.guidedPractice || '[]',
              independentPractice: data.independentPractice || '[]',
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
            }
          });
          break;
        case 'assessment':
          result = await prisma.assessment.create({ 
            data: {
              title: data.title,
              description: data.description || '',
              passage: data.passage || '',
              grade: data.grade,
              skillAreas: data.skillAreas || '[]',
              instructions: data.instructions || '',
              status: data.status || 'DRAFT',
              createdBy: req.user!.userId
            }
          });
          break;
        case 'pdf-resource':
          result = await prisma.pDFResource.create({ 
            data: {
              ...data,
              status: data.status || 'DRAFT',
              assignedGrades: data.assignedGrades ? JSON.stringify(data.assignedGrades) : null,
              requiredPlan: data.requiredPlan || null,
            }
          });
          break;
        default:
          throw new AppError('Invalid content type', 400);
      }
    }

    // Send notification for newly published content
    if (data.status === 'PUBLISHED' && !data.id) {
      try {
        const contentTitle = data.title || data.word || 'New content';
        const gradeLabel = data.grade ? `Grade ${data.grade.replace('GRADE_', '')}` : 'all grades';
        
        // Notify students who can access this content
        const whereClause: any = {};
        
        // Filter by grade if assignedGrades is specified
        if (data.assignedGrades && data.assignedGrades.length > 0) {
          whereClause.grade = { in: data.assignedGrades };
        }
        
        // Filter by plan if requiredPlan is specified
        if (data.requiredPlan) {
          whereClause.user = {
            status: data.requiredPlan === 'BASIC' ? { in: ['BASIC', 'PREMIUM'] } 
                  : data.requiredPlan === 'PREMIUM' ? 'PREMIUM'
                  : data.requiredPlan === 'DIAGNOSTIC' ? { in: ['DIAGNOSTIC', 'BASIC', 'PREMIUM'] }
                  : undefined
          };
        }
        
        const targetStudents = await prisma.student.findMany({
          where: whereClause,
          select: { userId: true },
        });

        await Promise.all(targetStudents.map(s =>
          createNotification({
            recipientId: s.userId,
            role: 'STUDENT',
            type: 'new_content',
            title: `📚 New ${type.charAt(0).toUpperCase() + type.slice(1)} Available`,
            message: `"${contentTitle}" is now available for you to explore!`,
            icon: type === 'passage' ? '📖' 
                : type === 'lesson' ? '📘'
                : type === 'vocabulary' ? '📚'
                : '📝',
            link: '/student/dashboard',
            meta: { contentType: type, contentTitle, grade: data.grade },
          })
        ));
      } catch (notificationError) {
        // Don't fail the content creation if notifications fail
        console.error('Failed to send notifications:', notificationError);
      }
    }

    res.status(data.id ? 200 : 201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Reuse the content update logic while keeping PUT requests explicit and REST-friendly.
export const updateContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { type, id } = req.params;
  const allowedFields: Record<string, string[]> = {
    lesson: ['skillArea', 'subskill', 'title', 'grade', 'difficulty', 'explanation', 'tips', 'order', 'examples', 'demonstrationSteps', 'guidedPractice', 'independentPractice', 'status', 'assignedGrades', 'requiredPlan'],
    passage: ['title', 'content', 'grade', 'difficulty', 'topic', 'wordCount', 'language', 'status', 'assignedGrades', 'requiredPlan'],
    question: ['passageId', 'skillArea', 'subskill', 'questionText', 'questionType', 'options', 'correctAnswer', 'explanation', 'grade', 'difficulty', 'status', 'assignedGrades', 'requiredPlan'],
    vocabulary: ['word', 'definition', 'exampleSentence', 'grade', 'difficulty', 'synonyms', 'antonyms', 'partOfSpeech', 'amharicTranslation', 'oromoTranslation', 'tigrinyaTranslation', 'status', 'assignedGrades', 'requiredPlan'],
  };
  const data = Object.fromEntries((allowedFields[type] ?? []).filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  req.body = { type, data: { ...data, id } };
  return createContent(req, res, next);
};

export const getAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profiles = await prisma.readingProfile.findMany({
      include: {
        student: { select: { grade: true } }
      }
    });

    // Grade breakdown
    const gradeBreakdown: Record<string, { count: number; avgScore: number }> = {};
    profiles.forEach(p => {
      const grade = p.student.grade;
      if (!gradeBreakdown[grade]) {
        gradeBreakdown[grade] = { count: 0, avgScore: 0 };
      }
      gradeBreakdown[grade].count++;
      gradeBreakdown[grade].avgScore += p.readinessScore;
    });

    Object.keys(gradeBreakdown).forEach(grade => {
      gradeBreakdown[grade].avgScore = Math.round(
        gradeBreakdown[grade].avgScore / gradeBreakdown[grade].count
      );
    });

    // Score distribution
    const distribution = {
      high: profiles.filter(p => p.readinessScore >= 75).length,
      medium: profiles.filter(p => p.readinessScore >= 60 && p.readinessScore < 75).length,
      low: profiles.filter(p => p.readinessScore < 60).length
    };

    res.json({
      success: true,
      data: {
        gradeBreakdown,
        distribution,
        totalAssessed: profiles.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Content Assignments ───────────────────────────────────────────────────────

export const getAssignments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const assignments = await prisma.contentAssignment.findMany({ orderBy: { assignedAt: 'desc' } });
    res.json({ success: true, data: assignments });
  } catch (error) { next(error); }
};

export const createAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { contentType, contentId, grade, note, dueDate } = req.body;
    const assignment = await prisma.contentAssignment.create({
      data: { contentType, contentId, grade, note, dueDate: dueDate ? new Date(dueDate) : undefined, assignedBy: 'Admin' }
    });

    // ── Fan-out notifications ──────────────────────────────────────────────────
    // Resolve content title
    let contentTitle = 'New content';
    try {
      const passage = contentType === 'passage' ? await prisma.passage.findUnique({ where: { id: contentId }, select: { title: true } }) : null;
      const lesson  = contentType === 'lesson'  ? await prisma.lesson.findUnique({ where: { id: contentId }, select: { title: true } }) : null;
      contentTitle = passage?.title ?? lesson?.title ?? contentTitle;
    } catch { /* keep default */ }

    const gradeLabel = grade === 'ALL' ? 'all grades' : `Grade ${grade.replace('GRADE_', '')}`;

    // Notify students in the target grade
    const targetStudents = await prisma.student.findMany({
      where: grade === 'ALL' ? {} : { grade },
      select: { userId: true },
    });
    await Promise.all(targetStudents.map(s =>
      createNotification({
        recipientId: s.userId,
        role: 'STUDENT',
        type: 'new_content',
        title: '📋 New Content Assigned',
        message: `"${contentTitle}" has been assigned to you. Open your dashboard to start!`,
        icon: contentType === 'passage' ? '📖' : '🎓',
        link: '/student/dashboard',
        meta: { grade, contentTitle, contentType },
      })
    ));

    // Notify all teachers
    await broadcastToRole('TEACHER', {
      type: 'new_content',
      title: 'Content Assigned to Students',
      message: `Admin assigned "${contentTitle}" to ${gradeLabel}.`,
      icon: '📋',
      link: '/teacher/dashboard',
      meta: { grade, contentTitle, contentType },
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) { next(error); }
};

export const updateAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.contentAssignment.update({ where: { id }, data: req.body });
    res.json({ success: true, data: assignment });
  } catch (error) { next(error); }
};

export const deleteAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.contentAssignment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
};

// ─── Content CRUD ──────────────────────────────────────────────────────────────

export const getPassages = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const passages = await prisma.passage.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: passages });
  } catch (error) { next(error); }
};

export const getQuestions = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const questions = await prisma.question.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: questions });
  } catch (error) { next(error); }
};

export const getVocabulary = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vocab = await prisma.vocabulary.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: vocab });
  } catch (error) { next(error); }
};

export const getLessons = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lessons = await prisma.lesson.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: lessons });
  } catch (error) { next(error); }
};

export const getAssessments = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const assessments = await prisma.assessment.findMany({ 
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: assessments });
  } catch (error) { next(error); }
};

export const getPDFResources = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resources = await prisma.pDFResource.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: resources });
  } catch (error) { next(error); }
};

export const uploadPDFResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { title, description, category, grade, difficulty, requiredPlan, assignedGrades } = req.body;

    // Upload to R2 if configured, otherwise store as data URI for 100% cloud persistence
    const { uploadToR2, FileCategory, isR2Configured } = await import('../lib/r2storage');
    let fileKey: string;
    if (isR2Configured()) {
      const result = await uploadToR2(req.file, FileCategory.RESOURCE);
      fileKey = result.key;
    } else {
      const mime = req.file.mimetype || 'application/pdf';
      const base64 = req.file.buffer.toString('base64');
      fileKey = `data:${mime};base64,${base64}`;
    }

    const targetGrade = grade || 'ALL';
    const targetAssignedGrades = assignedGrades || (targetGrade !== 'ALL' ? JSON.stringify([targetGrade]) : null);

    const resource = await prisma.pDFResource.create({
      data: {
        title: title || req.file.originalname.replace(/\.(pdf|ppt|pptx|xls|xlsx|doc|docx)$/i, ''),
        description: description || '',
        fileType: req.file.originalname.match(/\.([^.]+)$/)?.[1]?.toUpperCase() || 'PDF',
        fileName: req.file.originalname,
        fileUrl: fileKey,
        fileSize: req.file.size,
        category: category || 'RESOURCE',
        grade: targetGrade,
        difficulty: difficulty || 'MEDIUM',
        status: 'PUBLISHED', // Auto-publish for student access
        assignedGrades: targetAssignedGrades,
        requiredPlan: requiredPlan || null,
        uploadedBy: req.user!.userId
      }
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

export const getResourceDownloadUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const resource = await prisma.pDFResource.findUnique({ where: { id } });
    if (!resource) throw new AppError('Resource not found', 404);
    if (!resource.fileUrl) throw new AppError('No file available', 404);

    // Track download
    await prisma.pDFResource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    // If data URL or external web link, return directly
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

    // Generate signed URL if R2 is configured
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
      console.warn('[getResourceDownloadUrl] R2 error:', e);
    }

    // Local storage fallback
    const { getLocalUrl } = await import('../lib/localStorage');
    const localUrl = getLocalUrl(resource.fileUrl);
    res.json({ 
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

export const trackDownload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.pDFResource.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;

    if (type === 'passage') {
      // Delete child records first (SQLite does not enforce FK cascades on all relations)
      await prisma.question.updateMany({ where: { passageId: id }, data: { passageId: null } });
      await prisma.fluencyAssessment.deleteMany({ where: { passageId: id } });
      await prisma.passage.delete({ where: { id } });
    }

    if (type === 'question') {
      // Remove responses referencing this question before deleting
      await prisma.assessmentResponse.deleteMany({ where: { questionId: id } });
      await prisma.practiceResponse.deleteMany({ where: { questionId: id } });
      await prisma.question.delete({ where: { id } });
    }

    if (type === 'vocabulary') await prisma.vocabulary.delete({ where: { id } });

    if (type === 'lesson') {
      // Unlink learning activities before deleting lesson
      await prisma.learningActivity.updateMany({ where: { lessonId: id }, data: { lessonId: null } });
      await prisma.lesson.delete({ where: { id } });
    }

    if (type === 'assessment') {
      await prisma.assessment.delete({ where: { id } });
    }

    if (type === 'pdf-resource') {
      // Get the resource to delete from R2
      const resource = await prisma.pDFResource.findUnique({ where: { id } });
      if (resource && resource.fileUrl) {
        try {
          const { deleteFromR2 } = await import('../lib/r2storage');
          await deleteFromR2(resource.fileUrl);
        } catch (err) {
          console.error('Failed to delete resource from R2:', err);
          // Continue with database deletion
        }
      }
      await prisma.pDFResource.delete({ where: { id } });
    }

    res.json({ success: true });
  } catch (error) { next(error); }
};

export const getClasses = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.classGroup.findMany({ include: { memberships: { include: { student: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: classes });
  } catch (error) { next(error); }
};

export const createClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, grade, description, onlineLink } = req.body;
    if (!name?.trim() || !grade) throw new AppError('Class name and grade are required', 400);
    const classGroup = await prisma.classGroup.create({ data: { name: name.trim(), grade, description: description?.trim() || null, onlineLink: onlineLink?.trim() || null } });
    res.status(201).json({ success: true, data: classGroup });
  } catch (error) { next(error); }
};

export const assignClassStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentIds } = req.body as { studentIds?: string[] };
    if (!Array.isArray(studentIds) || studentIds.length === 0) throw new AppError('Student IDs are required', 400);
    await Promise.all(studentIds.map(studentId => prisma.classMembership.upsert({
      where: { classId_studentId: { classId: req.params.id, studentId } },
      update: {},
      create: { classId: req.params.id, studentId },
    })));
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const deleteClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { await prisma.classGroup.delete({ where: { id: req.params.id } }); res.json({ success: true }); } catch (error) { next(error); }
};

// ─── Student/Teacher/Parent management ─────────────────────────────────────────

export const getStudents = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: { readingProfiles: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    res.json({ success: true, data: students.map(s => ({
      ...s,
      score: s.readingProfiles[0]?.readinessScore ?? 0,
      status: (s.readingProfiles[0]?.readinessScore ?? 0) >= 75 ? 'READY' : (s.readingProfiles[0]?.readinessScore ?? 0) >= 60 ? 'DEVELOPING' : s.readingProfiles.length ? 'NEEDS_SUPPORT' : 'NOT_ASSESSED',
    }))});
  } catch (error) { next(error); }
};

export const getTeachers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teachers = await prisma.teacher.findMany({ orderBy: { createdAt: 'desc' }, include: { students: { select: { id: true } } } });
    res.json({ success: true, data: teachers });
  } catch (error) { next(error); }
};

export const getParents = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parents = await prisma.parent.findMany({ orderBy: { createdAt: 'desc' }, include: { children: { select: { id: true } } } });
    res.json({ success: true, data: parents });
  } catch (error) { next(error); }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bcrypt = await import('bcrypt');
    const { email, firstName, lastName, role, grade, password: rawPassword } = req.body;

    if (!email || !firstName || !lastName || !role) {
      throw new AppError('email, firstName, lastName, and role are required.', 400);
    }

    const VALID_ROLES = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'];
    if (!VALID_ROLES.includes(role)) throw new AppError('Invalid role.', 400);

    const trimmedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) throw new AppError('A user with this email already exists.', 400);

    // Use a provided password or a strong default; always hash with cost 12
    const plainPassword = rawPassword
      ? String(rawPassword)
      : `ReadPath@${Math.random().toString(36).slice(2, 10)}!`;
    const hashedPassword = await bcrypt.default.hash(plainPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        role,
        ...(role === 'STUDENT' && { student: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim(), grade } } }),
        ...(role === 'TEACHER' && { teacher: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
        ...(role === 'PARENT'  && { parent:  { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
        ...(role === 'ADMIN'   && { admin:   { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
      },
      include: { student: true, teacher: true, parent: true, admin: true },
    });

    // Return temporary password only once so the admin can communicate it
    res.status(201).json({
      success: true,
      data: user,
      ...(rawPassword ? {} : { temporaryPassword: plainPassword }),
    });
  } catch (error) { next(error); }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requesterId = req.user!.userId;

    // Prevent self-deletion
    const requesterUser = await prisma.user.findUnique({ where: { id: requesterId }, select: { id: true } });
    if (requesterUser?.id === id) {
      throw new AppError('You cannot delete your own account.', 403);
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) throw new AppError('User not found.', 404);

    // Prevent deleting the last admin
    if (target.role === 'ADMIN') {
      const adminCount = await prisma.admin.count();
      if (adminCount <= 1) {
        throw new AppError('Cannot delete the last admin account.', 403);
      }
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) { next(error); }
};

// Get all assessment submissions with audio recordings for admin review
export const getAllRecordingSubmissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all assessment submissions that have audio files
    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        audioUrl: { not: null }
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform submissions to match the expected format for recordings
    const recordings = submissions.map(submission => ({
      id: submission.id,
      studentId: submission.student.id,
      studentName: `${submission.student.firstName} ${submission.student.lastName}`,
      studentGrade: submission.student.grade,
      passageTitle: submission.assessment.title,
      audioUrl: submission.audioUrl,
      durationSeconds: submission.duration || 0,
      wpm: 0, // Not calculated for assessment submissions
      accuracy: 0, // Will be set during review
      cwpm: 0,
      totalWords: 0,
      pauseCount: 0,
      hesitationCount: 0,
      score: submission.overallScore || 0,
      reviewed: submission.status === 'REVIEWED',
      teacherNote: submission.feedback || '',
      teacherRating: 3, // Default rating
      reviewedAt: submission.reviewedAt?.toISOString() || null,
      recordedAt: submission.submittedAt?.toISOString() || submission.createdAt.toISOString(),
      // Add type to distinguish from fluency recordings
      type: 'assessment'
    }));

    res.json({
      success: true,
      data: recordings
    });

  } catch (error) {
    next(error);
  }
};

// Review assessment submission (for recordings shown in admin panel)
export const reviewRecordingSubmission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // submission ID
    const { note, rating } = req.body;

    // Update the assessment submission with admin feedback
    const updatedSubmission = await prisma.assessmentSubmission.update({
      where: { id },
      data: {
        status: 'REVIEWED',
        feedback: note || null,
        reviewedAt: new Date(),
        reviewedBy: req.user!.userId
      },
      include: {
        student: {
          select: {
            userId: true,
            firstName: true,
            lastName: true
          }
        },
        assessment: {
          select: {
            title: true
          }
        }
      }
    });

    // Notify the student about the review
    if (updatedSubmission.student) {
      const stars = parseInt(String(rating)) || 0;
      const ratingLabel = ['', 'Needs significant support', 'Below expectations', 'Meeting expectations', 'Good progress', 'Excellent reading!'][stars] ?? '';
      
      await createNotification({
        recipientId: updatedSubmission.student.userId,
        role: 'STUDENT',
        type: 'teacher_feedback',
        title: '🎉 Your assessment was reviewed!',
        message: `Your assessment "${updatedSubmission.assessment.title}" was reviewed by an admin. ${ratingLabel}`,
        icon: '🧑‍🏫',
        link: '/student/progress',
        meta: {
          assessmentTitle: updatedSubmission.assessment.title,
          rating: String(stars),
          note: note?.trim() || '',
          submissionId: updatedSubmission.id,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: updatedSubmission.id,
        reviewed: true,
        teacherNote: note || '',
        teacherRating: rating || 3,
        reviewedAt: updatedSubmission.reviewedAt?.toISOString() || null
      }
    });

  } catch (error) {
    next(error);
  }
};
// Get signed or direct URL for assessment submission audio
export const getRecordingSubmissionAudioUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // submission ID

    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id },
      select: { audioUrl: true }
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    if (!submission.audioUrl) {
      throw new AppError('No audio file available', 404);
    }

    // Direct playback for data URIs or public HTTP links
    if (submission.audioUrl.startsWith('data:') || submission.audioUrl.startsWith('http://') || submission.audioUrl.startsWith('https://')) {
      return res.json({ 
        success: true, 
        data: { url: submission.audioUrl } 
      });
    }

    // Generate signed URL if R2 configured
    try {
      const { getSignedDownloadUrl, isR2Configured } = await import('../lib/r2storage');
      if (isR2Configured()) {
        const signedUrl = await getSignedDownloadUrl(submission.audioUrl, 3600);
        return res.json({ 
          success: true, 
          data: { url: signedUrl } 
        });
      }
    } catch (e) {
      console.warn('[getRecordingSubmissionAudioUrl] R2 error:', e);
    }

    // Fallback to local storage URL
    const { getLocalUrl } = await import('../lib/localStorage');
    const localUrl = getLocalUrl(submission.audioUrl);

    res.json({ 
      success: true, 
      data: { url: localUrl || submission.audioUrl } 
    });

  } catch (error) {
    next(error);
  }
};

// ─── Admin Profile Management ────────────────────────────────────────────────
export const updateAdminProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user!.userId;

    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: String(phone).trim() }
      });
    }

    if (firstName || lastName) {
      await prisma.admin.upsert({
        where: { userId },
        update: {
          firstName: firstName ? String(firstName).trim() : undefined,
          lastName: lastName ? String(lastName).trim() : undefined,
        },
        create: {
          userId,
          firstName: String(firstName || 'Admin').trim(),
          lastName: String(lastName || 'User').trim()
        }
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { admin: true }
    });

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// ─── User Status Management (Activate / Suspend) ─────────────────────────────
export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'PAYMENT_PENDING', 'ACTIVE', 'SUSPENDED'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      include: { student: true, teacher: true, parent: true }
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};