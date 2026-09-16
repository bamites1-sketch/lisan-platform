import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification, broadcastToRole } from './notification.controller';

// Upload audio + save recording metadata
export const uploadRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: { include: { teacher: true } } } });
    if (!user?.student) throw new AppError('Student not found', 404);

    const file = (req as any).file as Express.Multer.File | undefined;
    const { passageTitle, passageId, durationSeconds, wpm, accuracy, cwpm, totalWords, pauseCount, hesitationCount, score } = req.body;

    const audioUrl = file ? `/uploads/recordings/${file.filename}` : undefined;

    const recording = await prisma.fluencyRecording.create({
      data: {
        studentId: user.student.id,
        teacherId: user.student.teacherId ?? undefined,
        passageId: passageId ?? undefined,
        passageTitle: passageTitle ?? 'Unknown Passage',
        audioUrl,
        durationSeconds: parseInt(durationSeconds) || 0,
        wpm: parseInt(wpm) || 0,
        // accuracy: store 0 only when explicitly submitted; teacher review will set the real value
        // A score/accuracy of 0 with reviewed=false means "pending review"
        accuracy: accuracy !== undefined && accuracy !== null && accuracy !== '' ? parseFloat(accuracy) : 0,
        cwpm: parseInt(cwpm) || 0,
        totalWords: parseInt(totalWords) || 0,
        pauseCount: parseInt(pauseCount) || 0,
        hesitationCount: parseInt(hesitationCount) || 0,
        score: parseInt(score) || 0,
      }
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    const studentName = `${user.student.firstName} ${user.student.lastName}`;
    const recScore    = parseInt(score) || 0;
    const recTitle    = passageTitle ?? 'Unknown Passage';
    const notifMeta   = {
      studentName,
      passage:     recTitle,
      recordingId: recording.id,
      score:       String(recScore),
      grade:       user.student.grade,
    };

    // Notify the student's teacher
    if (user.student.teacherId) {
      const teacherUser = await prisma.user.findFirst({
        where: { teacher: { id: user.student.teacherId } },
        select: { id: true },
      });
      if (teacherUser) {
        await createNotification({
          recipientId: teacherUser.id,
          role: 'TEACHER',
          type: 'new_recording',
          title: '🎤 New Reading Submitted',
          message: `${studentName} submitted a recording of "${recTitle}". Score: ${recScore}/100.`,
          icon: '🎤',
          link: '/teacher/dashboard',
          meta: notifMeta,
        });
      }
    }

    // Notify all admins
    await broadcastToRole('ADMIN', {
      type: 'new_recording',
      title: '🎤 New Fluency Recording',
      message: `${studentName} submitted "${recTitle}". Score: ${recScore}/100.`,
      icon: '🎤',
      link: '/admin/dashboard',
      meta: notifMeta,
    });

    res.status(201).json({ success: true, data: recording });
  } catch (error) {
    next(error);
  }
};

// Teacher: get all recordings for their students
export const getRecordingsForTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacher: true } });
    if (!user?.teacher) throw new AppError('Teacher not found', 404);

    // Get all students assigned to this teacher
    const students = await prisma.student.findMany({ where: { teacherId: user.teacher.id }, select: { id: true } });
    const studentIds = students.map(s => s.id);

    const recordings = await prisma.fluencyRecording.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { recordedAt: 'desc' },
    });

    // Attach student names
    const enriched = await Promise.all(recordings.map(async r => {
      const student = await prisma.student.findUnique({ where: { id: r.studentId }, select: { firstName: true, lastName: true, grade: true } });
      return { ...r, studentName: `${student?.firstName} ${student?.lastName}`, studentGrade: student?.grade };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// Admin: get all recordings
export const getAllRecordings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recordings = await prisma.fluencyRecording.findMany({ orderBy: { recordedAt: 'desc' } });

    const enriched = await Promise.all(recordings.map(async r => {
      const student = await prisma.student.findUnique({ where: { id: r.studentId }, select: { firstName: true, lastName: true, grade: true } });
      return { ...r, studentName: `${student?.firstName} ${student?.lastName}`, studentGrade: student?.grade };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// Teacher/Admin: save review (rating + note)
export const reviewRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note, rating } = req.body;

    const recording = await prisma.fluencyRecording.update({
      where: { id },
      data: { reviewed: true, teacherNote: note, teacherRating: parseInt(rating), reviewedAt: new Date() }
    });

    // Notify the student — find their User.id via studentId
    const student = await prisma.student.findUnique({
      where: { id: recording.studentId },
      select: { userId: true, firstName: true, lastName: true },
    });

    if (student) {
      const stars = parseInt(String(rating)) || 0;
      const ratingLabel = ['', 'Needs significant support', 'Below expectations', 'Meeting expectations', 'Good progress', 'Excellent reading!'][stars] ?? '';
      await createNotification({
        recipientId: student.userId,
        role: 'STUDENT',
        type: 'teacher_feedback',
        title: '🎉 Your reading was reviewed!',
        message: `Your teacher reviewed your reading of "${recording.passageTitle}". Rating: ${stars}/5 — ${ratingLabel}`,
        icon: '🧑‍🏫',
        link: '/student/progress',
        meta: {
          passage:  recording.passageTitle,
          score:    String(recording.score),
          rating:   String(stars),
          note:     note?.trim() ?? '',
          recordingId: recording.id,
        },
      });
    }

    res.json({ success: true, data: recording });
  } catch (error) {
    next(error);
  }
};

// Student: get their own recordings
export const getMyRecordings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
    if (!user?.student) throw new AppError('Student not found', 404);

    const recordings = await prisma.fluencyRecording.findMany({
      where: { studentId: user.student.id },
      orderBy: { recordedAt: 'desc' }
    });

    res.json({ success: true, data: recordings });
  } catch (error) {
    next(error);
  }
};
