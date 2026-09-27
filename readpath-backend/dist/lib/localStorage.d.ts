/**
 * Local File Storage Service
 *
 * Handles file uploads for local development when R2 is not configured.
 * Files are stored in the uploads directory and served via express static middleware.
 */
export declare enum FileCategory {
    RECORDING = "recordings",
    RECEIPT = "receipts",
    RESOURCE = "resources"
}
export declare function generateLocalFileKey(category: FileCategory, originalName: string): string;
export declare function uploadToLocal(file: Express.Multer.File, category: FileCategory): Promise<{
    key: string;
    size: number;
    localPath: string;
}>;
export declare function getLocalUrl(key: string, baseUrl?: string): string;
export declare function deleteLocalFile(key: string): void;
export declare function localFileExists(key: string): boolean;
//# sourceMappingURL=localStorage.d.ts.map