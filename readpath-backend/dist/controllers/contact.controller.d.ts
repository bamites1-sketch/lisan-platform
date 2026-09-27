import { Request, Response, NextFunction } from 'express';
/**
 * POST /api/contact  (public — no auth required)
 *
 * Saves the contact message to the database so Dr. Habtamu
 * can read it from the admin panel in the future.
 *
 * Body: { name, email, subject, message }
 */
export declare const sendContactMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=contact.controller.d.ts.map