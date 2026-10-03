import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const submitPayment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMySubmissions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const listAllPayments: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getReceiptUrl: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getReceiptImage: (req: any, res: Response, next: NextFunction) => Promise<void>;
export declare const approvePayment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const rejectPayment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map