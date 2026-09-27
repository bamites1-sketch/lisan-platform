"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.changePassword = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
// ─── Constants ────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12; // OWASP recommended minimum
const JWT_ACCESS_EXPIRY = '15m'; // short-lived access token
const JWT_REFRESH_EXPIRY = '7d'; // longer-lived refresh token
const VALID_ROLES = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'];
// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Password policy: ≥8 chars, at least one uppercase, one lowercase, one digit.
 * Returns an error string or null if valid.
 */
function validatePassword(password) {
    if (password.length < 8)
        return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password))
        return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password))
        return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password))
        return 'Password must contain at least one number.';
    return null;
}
/** Basic email format guard */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}
function buildUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status ?? 'PENDING',
        profile: user.student || user.parent || user.teacher || user.admin,
    };
}
// ─── register ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        const { email, phone, password, role, firstName, lastName, grade } = req.body;
        // --- Input validation ---
        if (!email || !password || !role || !firstName || !lastName) {
            throw new errorHandler_1.AppError('Please provide all required fields.', 400);
        }
        const trimmedEmail = String(email).trim().toLowerCase();
        if (!isValidEmail(trimmedEmail)) {
            throw new errorHandler_1.AppError('Please provide a valid email address.', 400);
        }
        if (!VALID_ROLES.includes(role)) {
            throw new errorHandler_1.AppError('Invalid role specified.', 400);
        }
        // Prevent self-registration as ADMIN
        if (role === 'ADMIN') {
            throw new errorHandler_1.AppError('Admin accounts cannot be self-registered.', 403);
        }
        if (role === 'STUDENT' && !grade) {
            throw new errorHandler_1.AppError('Grade is required for student accounts.', 400);
        }
        const passwordError = validatePassword(String(password));
        if (passwordError)
            throw new errorHandler_1.AppError(passwordError, 400);
        // --- Duplicate check ---
        const existing = await prisma_1.default.user.findUnique({ where: { email: trimmedEmail } });
        if (existing) {
            // Generic message — don't reveal whether the email is registered
            throw new errorHandler_1.AppError('Registration failed. Please check your details or try a different email.', 400);
        }
        const hashedPassword = await bcrypt_1.default.hash(String(password), BCRYPT_ROUNDS);
        const user = await prisma_1.default.user.create({
            data: {
                email: trimmedEmail,
                phone: phone ? String(phone).trim() : undefined,
                password: hashedPassword,
                role,
                ...(role === 'STUDENT' && { student: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim(), grade } } }),
                ...(role === 'PARENT' && { parent: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
                ...(role === 'TEACHER' && { teacher: { create: { firstName: String(firstName).trim(), lastName: String(lastName).trim() } } }),
            },
            include: { student: true, parent: true, teacher: true, admin: true },
        });
        const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
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
            data: { token: accessToken, refreshToken, user: buildUserResponse(user) },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
// ─── login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new errorHandler_1.AppError('Please provide email and password.', 400);
        }
        const trimmedEmail = String(email).trim().toLowerCase();
        // Always fetch and compare — never short-circuit before bcrypt to prevent timing attacks
        const user = await prisma_1.default.user.findUnique({
            where: { email: trimmedEmail },
            include: { student: true, parent: true, teacher: true, admin: true },
        });
        // Use a dummy compare when user not found to preserve constant time
        // IMPORTANT: dummyHash must be a FORMATTED-VALID bcrypt $2b$12$ hash
        // (22-char salt + 31-char hash in radix-64).  An invalid hash string
        // causes bcrypt.compare to throw, which bubbles up as 500 instead of 401.
        const dummyHash = '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';
        const isValid = user
            ? await bcrypt_1.default.compare(String(password), user.password)
            : await bcrypt_1.default.compare(String(password), dummyHash).then(() => false);
        if (!user || !isValid) {
            throw new errorHandler_1.AppError('Invalid email or password.', 401);
        }
        // Update last active time for students
        if (user.student) {
            await prisma_1.default.student.update({
                where: { id: user.student.id },
                data: { lastActiveAt: new Date() },
            });
        }
        const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
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
            data: { token: accessToken, refreshToken, user: buildUserResponse(user) },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// ─── refreshToken ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
    try {
        let token = req.cookies?.refreshToken;
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }
        if (!token)
            throw new errorHandler_1.AppError('No refresh token provided.', 401);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        }
        catch {
            throw new errorHandler_1.AppError('Refresh token is invalid or expired. Please sign in again.', 401);
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, email: true },
        });
        if (!user)
            throw new errorHandler_1.AppError('Account no longer exists.', 401);
        const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
        const newRefreshToken = signRefreshToken({ userId: user.id });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ success: true, data: { token: accessToken, refreshToken: newRefreshToken } });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
// ─── logout ───────────────────────────────────────────────────────────────────
const logout = (_req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
};
exports.logout = logout;
// ─── changePassword ───────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new errorHandler_1.AppError('Please provide current and new passwords.', 400);
        }
        const passwordError = validatePassword(String(newPassword));
        if (passwordError)
            throw new errorHandler_1.AppError(passwordError, 400);
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found.', 404);
        const isValid = await bcrypt_1.default.compare(String(currentPassword), user.password);
        if (!isValid)
            throw new errorHandler_1.AppError('Current password is incorrect.', 401);
        if (String(currentPassword) === String(newPassword)) {
            throw new errorHandler_1.AppError('New password must differ from the current password.', 400);
        }
        const hashedNew = await bcrypt_1.default.hash(String(newPassword), BCRYPT_ROUNDS);
        await prisma_1.default.user.update({
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
        res.json({ success: true, message: 'Password changed successfully. Please sign in again on other devices.', data: { refreshToken: newRefreshToken } });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
// ─── getCurrentUser ────────────────────────────────────────────────────────────
const getCurrentUser = async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
            include: { student: true, parent: true, teacher: true, admin: true },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found.', 404);
        res.json({ success: true, data: buildUserResponse(user) });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.controller.js.map