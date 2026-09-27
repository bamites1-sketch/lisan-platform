"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactMessage = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * POST /api/contact  (public — no auth required)
 *
 * Saves the contact message to the database so Dr. Habtamu
 * can read it from the admin panel in the future.
 *
 * Body: { name, email, subject, message }
 */
const sendContactMessage = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;
        // ── Validation ────────────────────────────────────────────────
        const errors = {};
        if (!name?.trim())
            errors.name = 'Your name is required.';
        if (!email?.trim())
            errors.email = 'Your email address is required.';
        if (!message?.trim())
            errors.message = 'A message is required.';
        // Basic email format check
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRe.test(email.trim())) {
            errors.email = 'Please enter a valid email address.';
        }
        if (Object.keys(errors).length > 0) {
            res.status(422).json({ success: false, errors });
            return;
        }
        // ── Persist ───────────────────────────────────────────────────
        // Store in the ContactMessage table (created via db push below).
        // If the table doesn't exist yet, we fall back gracefully and still
        // return success so the user is not left wondering.
        let saved = false;
        try {
            await prisma_1.default.contactMessage.create({
                data: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    subject: subject?.trim() ?? '',
                    message: message.trim(),
                },
            });
            saved = true;
        }
        catch {
            // Table might not exist yet — log server-side, don't fail the request
            console.warn('[contact] ContactMessage table not found — message not persisted.');
        }
        res.status(201).json({
            success: true,
            saved,
            message: saved
                ? 'Your message has been received. Dr. Habtamu will get back to you soon.'
                : 'Your message was received but could not be saved right now. Please email directly: HABTAMUGEBREKIDAN@GMAIL.COM',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendContactMessage = sendContactMessage;
//# sourceMappingURL=contact.controller.js.map