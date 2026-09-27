"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActive = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * authenticate
 * - Verifies the JWT signature and expiry
 * - Re-fetches the user from the DB so deleted/disabled accounts are rejected immediately
 * - Rejects tokens issued before the user's `passwordChangedAt` (if that field exists)
 */
const authenticate = async (req, _res, next) => {
    try {
        // 1. Extract Bearer token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token)
            throw new errorHandler_1.AppError('Authentication required', 401);
        // 2. Verify signature + expiry
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errorHandler_1.AppError('Your session has expired. Please sign in again.', 401);
            }
            throw new errorHandler_1.AppError('Invalid or tampered token.', 401);
        }
        // 3. Confirm user still exists in DB
        const dbUser = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, email: true, passwordChangedAt: true },
        });
        if (!dbUser) {
            throw new errorHandler_1.AppError('Account no longer exists. Please register again.', 401);
        }
        // 4. Reject tokens issued before a password change
        if (dbUser.passwordChangedAt) {
            const changedTimestamp = Math.floor(dbUser.passwordChangedAt.getTime() / 1000);
            if (decoded.iat < changedTimestamp) {
                throw new errorHandler_1.AppError('Password was recently changed. Please sign in again.', 401);
            }
        }
        // 5. Attach verified user to request
        req.user = {
            userId: dbUser.id,
            role: dbUser.role,
            email: dbUser.email,
            iat: decoded.iat,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * authorize
 * Role-based guard. Must be used after authenticate.
 */
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('You do not have permission to access this resource.', 403));
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * requireActive
 * Blocks STUDENT and PARENT users whose account status is not ACTIVE.
 * ADMIN and TEACHER are always allowed through.
 * Must be placed after authenticate().
 */
const requireActive = async (req, _res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Authentication required', 401));
    }
    // Admins and teachers are never blocked by payment status
    if (req.user.role === 'ADMIN' || req.user.role === 'TEACHER') {
        return next();
    }
    // For students and parents — check DB status
    const dbUser = await prisma_1.default.user.findUnique({
        where: { id: req.user.userId },
        select: { status: true },
    }).catch(() => null);
    if (!dbUser || dbUser.status !== 'ACTIVE') {
        return next(new errorHandler_1.AppError('Your account is not yet active. Please complete payment verification.', 403));
    }
    return next();
};
exports.requireActive = requireActive;
//# sourceMappingURL=auth.js.map