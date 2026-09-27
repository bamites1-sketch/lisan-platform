/**
 * Cloudflare R2 Storage Service
 *
 * Handles all file uploads, downloads, and deletions using Cloudflare R2 (S3-compatible).
 * Files are private by default and accessed via signed URLs.
 */
export declare enum FileCategory {
    RECORDING = "recordings",
    RECEIPT = "receipts",
    RESOURCE = "resources"
}
export declare function validateFile(file: Express.Multer.File, category: FileCategory): {
    valid: boolean;
    error?: string;
};
export declare function generateFileKey(category: FileCategory, originalName: string): string;
export declare function uploadToR2(file: Express.Multer.File, category: FileCategory): Promise<{
    key: string;
    size: number;
}>;
export declare function getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
export declare function deleteFromR2(key: string): Promise<void>;
export declare function batchDeleteFromR2(keys: string[]): Promise<void>;
export declare function isR2Configured(): boolean;
export declare function getPublicUrl(key: string): string;
//# sourceMappingURL=r2storage.d.ts.map