import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import prisma from '../lib/prisma';

// Allowed role values — kept as a plain union instead of importing the Prisma enum
// so this middleware compiles even when Prisma enums are not generated yet.
export type Role = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: Role;
    email: string;
    iat: number;
  };
}

interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
  iat: number;
  exp: number;
}

/**
 * authenticate
 * - Verifies the JWT signature and expiry
 * - Re-fetches the user from the DB so deleted/disabled accounts are rejected immediately
 * - Rejects tokens issued before the user's `passwordChangedAt` (if that field exists)
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    const token = authHeader.split(' ')[1];
    if (!token) throw new AppError('Authentication required', 401);

    // 2. Verify signature + expiry
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Your session has expired. Please sign in again.', 401);
      }
      throw new AppError('Invalid or tampered token.', 401);
    }

    // 3. Confirm user still exists in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, passwordChangedAt: true },
    });

    if (!dbUser) {
      throw new AppError('Account no longer exists. Please register again.', 401);
    }

    // 4. Reject tokens issued before a password change
    if (dbUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(dbUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        throw new AppError('Password was recently changed. Please sign in again.', 401);
      }
    }

    // 5. Attach verified user to request
    req.user = {
      userId: dbUser.id,
      role: dbUser.role as Role,
      email: dbUser.email,
      iat: decoded.iat,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * authorize
 * Role-based guard. Must be used after authenticate.
 */
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource.', 403));
    }
    next();
  };
};

/**
 * requireActive
 * Blocks STUDENT and PARENT users whose account status is not ACTIVE.
 * ADMIN and TEACHER are always allowed through.
 * Must be placed after authenticate().
 */
export const requireActive = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  // Admins and teachers are never blocked by payment status
  if (req.user.role === 'ADMIN' || req.user.role === 'TEACHER') {
    return next();
  }
  // For students and parents — check DB status
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { status: true },
  }).catch(() => null);

  if (!dbUser || dbUser.status !== 'ACTIVE') {
    return next(new AppError('Your account is not yet active. Please complete payment verification.', 403));
  }
  return next();
};
