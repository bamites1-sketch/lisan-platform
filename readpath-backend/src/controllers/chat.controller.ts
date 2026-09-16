import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { getTutorResponse } from '../services/ai.service';

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { message, context: additionalContext } = req.body;

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            readingProfiles: {
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

    // Save user message
    await prisma.chatMessage.create({
      data: {
        studentId: student.id,
        role: 'user',
        message,
        context: additionalContext
      }
    });

    // Get recent chat history for context
    const recentHistory = await prisma.chatMessage.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const chatHistory = recentHistory
      .reverse()
      .slice(0, -1) // Exclude the message we just created
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.message
      }));

    // Add current message
    chatHistory.push({ role: 'user', content: message });

    // Build student context
    const weaknesses = latestProfile?.weaknesses ? JSON.parse(latestProfile.weaknesses) : [];
    const priorities = latestProfile?.priorities ? JSON.parse(latestProfile.priorities) : [];
    const studentContext = {
      firstName: student.firstName,
      grade: student.grade,
      readinessScore: latestProfile?.readinessScore,
      weaknesses: Array.isArray(weaknesses) ? weaknesses.map(w => typeof w === 'string' ? w : w.skill) : [],
      priorities: Array.isArray(priorities) ? priorities : [],
      currentLesson: additionalContext?.currentLesson
    };

    // Get AI response
    const aiResponse = await getTutorResponse(chatHistory, studentContext);

    // Save AI response
    const savedResponse = await prisma.chatMessage.create({
      data: {
        studentId: student.id,
        role: 'assistant',
        message: aiResponse.text
      }
    });

    res.json({
      success: true,
      data: {
        message: aiResponse.text,
        messageId: savedResponse.id,
        provider: aiResponse.provider
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (
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

    const history = await prisma.chatMessage.findMany({
      where: { studentId: user.student.id },
      orderBy: { createdAt: 'asc' },
      take: 50 // Last 50 messages
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};
