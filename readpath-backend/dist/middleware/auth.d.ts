import { Request, Response, NextFunction } from 'express';
export type Role = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: Role;
        email: string;
        iat: number;
    };
}
/**
 * authenticate
 * - Verifies the JWT signature and expiry
 * - Re-fetches the user from the DB so deleted/disabled accounts are rejected immediately
 * - Rejects tokens issued before the user's `passwordChangedAt` (if that field exists)
 */
export declare const authenticate: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * authorize
 * Role-based guard. Must be used after authenticate.
 */
export declare const authorize: (...roles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
/**
 * requireActive
 * Blocks STUDENT and PARENT users whose account status is not ACTIVE.
 * ADMIN and TEACHER are always allowed through.
 * Must be placed after authenticate().
 */
export declare const requireActive: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map