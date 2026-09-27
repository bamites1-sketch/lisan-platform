import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getStudents: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStudentDetail: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getClassAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=teacher.controller.d.ts.map