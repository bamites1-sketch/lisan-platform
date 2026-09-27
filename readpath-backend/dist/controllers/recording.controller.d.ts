import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const uploadRecording: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getRecordingsForTeacher: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllRecordings: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const reviewRecording: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyRecordings: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getRecordingAudioUrl: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteRecording: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=recording.controller.d.ts.map