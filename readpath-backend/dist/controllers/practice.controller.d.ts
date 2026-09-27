import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const startPractice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const submitPracticeResponse: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const completePractice: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPracticeHistory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=practice.controller.d.ts.map