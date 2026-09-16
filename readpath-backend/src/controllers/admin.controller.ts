import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification, broadcastToRole } from './notification.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ─── File Upload Configuration ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'resources');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.pdf', '.ppt', '.pptx', '.xls', '.xlsx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PPT, and Excel files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
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

    const { title } = req.body;
    const fileUrl = `/uploads/resources/${req.file.filename}`;
    
    const resource = await prisma.pDFResource.create({
      data: {
        title: title || req.file.originalname.replace('.pdf', ''),
        description: '',
        fileType: 'PDF',
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        category: 'RESOURCE',
        grade: 'GRADE_6',
        difficulty: 'MEDIUM',
        status: 'PUBLISHED', // Auto-publish for simplicity
        uploadedBy: req.user!.userId
      }
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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
      // Get the resource to delete the physical file
      const resource = await prisma.pDFResource.findUnique({ where: { id } });
      if (resource && resource.fileUrl) {
        const filePath = path.join(process.cwd(), resource.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
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
