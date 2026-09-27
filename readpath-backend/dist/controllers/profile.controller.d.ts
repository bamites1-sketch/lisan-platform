import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getReadingProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProfileHistory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=profile.controller.d.ts.map