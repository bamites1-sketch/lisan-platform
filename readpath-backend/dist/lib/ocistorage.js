"use strict";
/**
 * Oracle Cloud Object Storage Service
 *
 * Handles all file uploads, downloads, and deletions using Oracle OCI Object Storage.
 * Compatible with S3 API (uses AWS SDK with OCI endpoints).
 * Files are private by default and accessed via signed URLs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isR2Configured = exports.batchDeleteFromR2 = exports.deleteFromR2 = exports.uploadToR2 = exports.FileCategory = void 0;
exports.validateFile = validateFile;
exports.generateFileKey = generateFileKey;
exports.uploadToOCI = uploadToOCI;
exports.getSignedDownloadUrl = getSignedDownloadUrl;
exports.deleteFromOCI = deleteFromOCI;
exports.batchDeleteFromOCI = batchDeleteFromOCI;
exports.isOCIConfigured = isOCIConfigured;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
// ─── OCI Storage Client Configuration ─────────────────────────────────────────
const ociClient = new client_s3_1.S3Client({
    region: process.env.OCI_REGION || 'us-ashburn-1',
    endpoint: `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${process.env.OCI_REGION || 'us-ashburn-1'}.oraclecloud.com`,
    credentials: {
        accessKeyId: process.env.OCI_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // Required for OCI
});
const BUCKET_NAME = process.env.OCI_BUCKET_NAME || 'lisan-storage';
// ─── File Type Configurations ─────────────────────────────────────────────────
var FileCategory;
(function (FileCategory) {
    FileCategory["RECORDING"] = "recordings";
    FileCategory["RECEIPT"] = "receipts";
    FileCategory["RESOURCE"] = "resources";
})(FileCategory || (exports.FileCategory = FileCategory = {}));
const FILE_CONFIGS = {
    [FileCategory.RECORDING]: {
        allowedExtensions: ['.webm', '.ogg', '.mp3', '.mp4', '.wav', '.aac', '.flac', '.m4a'],
        allowedMimeTypes: ['audio/', 'video/webm', 'video/mp4'],
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        contentType: 'audio/webm',
    },
    [FileCategory.RECEIPT]: {
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        contentType: 'image/jpeg',
    },
    [FileCategory.RESOURCE]: {
        allowedExtensions: ['.pdf', '.ppt', '.pptx', '.xls', '.xlsx', '.doc', '.docx'],
        allowedMimeTypes: [
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        contentType: 'application/pdf',
    },
};
// ─── Validation ───────────────────────────────────────────────────────────────
function validateFile(file, category) {
    const config = FILE_CONFIGS[category];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
        return { valid: false, error: `File type ${ext} not allowed for ${category}` };
    }
    if (!config.allowedMimeTypes.some(mime => file.mimetype.startsWith(mime))) {
        return { valid: false, error: `MIME type ${file.mimetype} not allowed for ${category}` };
    }
    if (file.size > config.maxSizeBytes) {
        return { valid: false, error: `File too large. Max size: ${config.maxSizeBytes / 1024 / 1024}MB` };
    }
    return { valid: true };
}
// ─── Generate Secure File Key ─────────────────────────────────────────────────
function generateFileKey(category, originalName) {
    const ext = path_1.default.extname(originalName).toLowerCase();
    const randomName = crypto_1.default.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${category}/${timestamp}-${randomName}${ext}`;
}
// ─── Upload File to OCI ───────────────────────────────────────────────────────
async function uploadToOCI(file, category) {
    // Validate file
    const validation = validateFile(file, category);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    const key = generateFileKey(category, file.originalname);
    const config = FILE_CONFIGS[category];
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || config.contentType,
        Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            category,
        },
    });
    await ociClient.send(command);
    return {
        key,
        size: file.size,
    };
}
// ─── Generate Signed URL for Private Access ───────────────────────────────────
async function getSignedDownloadUrl(key, expiresInSeconds = 3600) {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return await (0, s3_request_presigner_1.getSignedUrl)(ociClient, command, { expiresIn: expiresInSeconds });
}
// ─── Delete File from OCI ─────────────────────────────────────────────────────
async function deleteFromOCI(key) {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    await ociClient.send(command);
}
// ─── Batch Delete ─────────────────────────────────────────────────────────────
async function batchDeleteFromOCI(keys) {
    await Promise.all(keys.map(key => deleteFromOCI(key)));
}
// ─── Check if OCI is Configured ───────────────────────────────────────────────
function isOCIConfigured() {
    return !!(process.env.OCI_NAMESPACE &&
        process.env.OCI_ACCESS_KEY_ID &&
        process.env.OCI_SECRET_ACCESS_KEY &&
        process.env.OCI_BUCKET_NAME &&
        process.env.OCI_REGION);
}
// ─── Backward compatibility aliases for R2 code ───────────────────────────────
exports.uploadToR2 = uploadToOCI;
exports.deleteFromR2 = deleteFromOCI;
exports.batchDeleteFromR2 = batchDeleteFromOCI;
exports.isR2Configured = isOCIConfigured;
//# sourceMappingURL=ocistorage.js.map