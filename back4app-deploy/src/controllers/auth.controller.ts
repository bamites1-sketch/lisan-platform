import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ─── Constants ────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12; // OWASP recommended minimum
const JWT_ACCESS_EXPIRY  = '15m';  // short-lived access token
const JWT_REFRESH_EXPIRY = '7d';   // longer-lived refresh token

const VALID_ROLES = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Password policy: ≥8 chars, at least one uppercase, one lowercase, one digit.
 * Returns an error string or null if valid.
 */
function validatePassword(password: string): string | null {
  if (password.length < 8)           return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password))       return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password))       return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password))       return 'Password must contain at least one number.';
  return null;
}

/** Basic email format guard */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signAccessToken(payload: { userId: string; role: string; email: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: JWT_ACCESS_EXPIRY });
}

function signRefreshToken(payload: { userId: string }) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: JWT_REFRESH_EXPIRY });
}

function buildUserResponse(user: {
  id: string; email: string; role: string; status?: string;
  student?: object | null; parent?: object | null;
  teacher?: object | null; admin?: object | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status ?? 'PENDING',
    profile: user.student || user.parent || user.teacher || user.admin,
  };
}

// ─── register ────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, role, firstName, lastName, grade } = req.body;

    // --- Input validation ---
    if (!email || !password || !role || !firstName || !lastName) {
      throw new AppError('Please provide all required fields.', 400);
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    if (!VALID_ROLES.includes(role)) {
      throw new AppError('Invalid role specified.', 400);
    }

    // Prevent self-registration as ADMIN
    if (role === 'ADMIN') {
      throw new AppError('Admin accounts cannot be self-registered.', 403);
    }

    if (role === 'STUDENT' && !grade) {
      throw new AppError('Grade is required for student accounts.', 400);
    }

    const passwordError = validatePassword(String(password));
    if (passwordError) throw new AppError(passwordError, 400);

    // --- Duplicate check ---
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      // Generic message — don't reveal whether the email is registered
      throw new AppError('Registration failed. Please check your details or try a different email.', 400);
    }

    const hashedPassword = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        phone:    phone ? String(phone).trim() : undefined,
        password: hashedPassword,
        role,
        ...(role === 'STUDENT' && { student: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim(), grade } } }),
        ...(role === 'PARENT'  && { parent:  { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
        ...(role === 'TEACHER' && { teacher: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
      },
      include: { student: true, parent: true, teacher: true, admin: true },
    });

    const accessToken  = signAccessToken({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id });

    // Refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { token: accessToken, user: buildUserResponse(user) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── login ───────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password.', 400);
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Always fetch and compare — never short-circuit before bcrypt to prevent timing attacks
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { student: true, parent: true, teacher: true, admin: true },
    });

    // Use a dummy compare when user not found to preserve constant time
    const dummyHash = '$2b$12$invalidhashforunregisteredemail000000000000000000000000';
    const isValid = user
      ? await bcrypt.compare(String(password), user.password)
      : await bcrypt.compare(String(password), dummyHash).then(() => false);

    if (!user || !isValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Update last active time for students
    if (user.student) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: { lastActiveAt: new Date() },
      });
    }

    const accessToken  = signAccessToken({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: { token: accessToken, user: buildUserResponse(user) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── refreshToken ─────────────────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token provided.', 401);

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    } catch {
      throw new AppError('Refresh token is invalid or expired. Please sign in again.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) throw new AppError('Account no longer exists.', 401);

    const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });

    res.json({ success: true, data: { token: accessToken } });
  } catch (error) {
    next(error);
  }
};

// ─── logout ───────────────────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ─── changePassword ───────────────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Please provide current and new passwords.', 400);
    }

    const passwordError = validatePassword(String(newPassword));
    if (passwordError) throw new AppError(passwordError, 400);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found.', 404);

    const isValid = await bcrypt.compare(String(currentPassword), user.password);
    if (!isValid) throw new AppError('Current password is incorrect.', 401);

    if (String(currentPassword) === String(newPassword)) {
      throw new AppError('New password must differ from the current password.', 400);
    }

    const hashedNew = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNew,
        passwordChangedAt: new Date(), // invalidates all previously issued tokens
      },
    });

    // Rotate refresh cookie
    const newRefreshToken = signRefreshToken({ userId: user.id });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: 'Password changed successfully. Please sign in again on other devices.' });
  } catch (error) {
    next(error);
  }
};

// ─── getCurrentUser ────────────────────────────────────────────────────────────
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { student: true, parent: true, teacher: true, admin: true },
    });

    if (!user) throw new AppError('User not found.', 404);

    res.json({ success: true, data: buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
};
