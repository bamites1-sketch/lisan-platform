import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { createNotification, broadcastToRole } from './notification.controller';
import { uploadToR2, deleteFromR2, FileCategory } from '../lib/r2storage';

// Upload audio + save recording metadata
export const uploadRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: { include: { teacher: true } } } });
    if (!user?.student) throw new AppError('Student not found', 404);

    const file = (req as any).file as Express.Multer.File | undefined;
    const { passageTitle, passageId, durationSeconds, wpm, accuracy, cwpm, totalWords, pauseCount, hesitationCount, score } = req.body;

    // Upload to R2 if file provided
    let audioKey: string | undefined;
    if (file) {
      const result = await uploadToR2(file, FileCategory.RECORDING);
      audioKey = result.key;
    }

    const recording = await prisma.fluencyRecording.create({
      data: {
        studentId: user.student.id,
        teacherId: user.student.teacherId ?? undefined,
        passageId: passageId ?? undefined,
        passageTitle: passageTitle ?? 'Unknown Passage',
        audioUrl: audioKey, // Store R2 key instead of local path
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

// Get signed URL for audio playback
export const getRecordingAudioUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true, teacher: true } });

    const recording = await prisma.fluencyRecording.findUnique({ where: { id } });
    if (!recording) throw new AppError('Recording not found', 404);

    // Authorization: students can only access their own; teachers can access their students'; admins can access all
    const isStudent = user?.student && recording.studentId === user.student.id;
    const isTeacher = user?.teacher && recording.teacherId === user.teacher.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isStudent && !isTeacher && !isAdmin) {
      throw new AppError('Not authorized to access this recording', 403);
    }

    if (!recording.audioUrl) {
      throw new AppError('No audio file available', 404);
    }

    // Generate signed URL (valid for 1 hour)
    const { getSignedDownloadUrl } = await import('../lib/r2storage');
    const signedUrl = await getSignedDownloadUrl(recording.audioUrl, 3600);

    res.json({ success: true, data: { url: signedUrl } });
  } catch (error) {
    next(error);
  }
};

// Delete recording (and its R2 file)
export const deleteRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const recording = await prisma.fluencyRecording.findUnique({ where: { id } });
    if (!recording) throw new AppError('Recording not found', 404);

    // Delete from R2 if exists
    if (recording.audioUrl) {
      try {
        await deleteFromR2(recording.audioUrl);
      } catch (err) {
        console.error('Failed to delete audio from R2:', err);
        // Continue with database deletion even if R2 deletion fails
      }
    }

    // Delete from database
    await prisma.fluencyRecording.delete({ where: { id } });

    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (error) {
    next(error);
  }
};
