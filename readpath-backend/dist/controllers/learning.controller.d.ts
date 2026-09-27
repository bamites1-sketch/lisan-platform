import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getLearningPlan: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLessons: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLesson: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const completeActivity: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=learning.controller.d.ts.map