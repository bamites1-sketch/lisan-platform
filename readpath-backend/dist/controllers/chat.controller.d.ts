import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getChatHistory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=chat.controller.d.ts.map