import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getDashboard: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProgressLogs: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStudentAssignments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStudentClasses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStudentContent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getContentItem: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStudentResources: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStudentResourceDownloadUrl: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=student.controller.d.ts.map