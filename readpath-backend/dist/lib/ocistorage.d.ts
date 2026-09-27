/**
 * Oracle Cloud Object Storage Service
 *
 * Handles all file uploads, downloads, and deletions using Oracle OCI Object Storage.
 * Compatible with S3 API (uses AWS SDK with OCI endpoints).
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
export declare function uploadToOCI(file: Express.Multer.File, category: FileCategory): Promise<{
    key: string;
    size: number;
}>;
export declare function getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
export declare function deleteFromOCI(key: string): Promise<void>;
export declare function batchDeleteFromOCI(keys: string[]): Promise<void>;
export declare function isOCIConfigured(): boolean;
export declare const uploadToR2: typeof uploadToOCI;
export declare const deleteFromR2: typeof deleteFromOCI;
export declare const batchDeleteFromR2: typeof batchDeleteFromOCI;
export declare const isR2Configured: typeof isOCIConfigured;
//# sourceMappingURL=ocistorage.d.ts.map