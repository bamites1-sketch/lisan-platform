"use strict";
/**
 * Cloudflare R2 Storage Service
 *
 * Handles all file uploads, downloads, and deletions using Cloudflare R2 (S3-compatible).
 * Files are private by default and accessed via signed URLs.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCategory = void 0;
exports.validateFile = validateFile;
exports.generateFileKey = generateFileKey;
exports.uploadToR2 = uploadToR2;
exports.getSignedDownloadUrl = getSignedDownloadUrl;
exports.deleteFromR2 = deleteFromR2;
exports.batchDeleteFromR2 = batchDeleteFromR2;
exports.isR2Configured = isR2Configured;
exports.getPublicUrl = getPublicUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
// ─── R2 Client Configuration ──────────────────────────────────────────────────
const r2Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lisan-storage';
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
// ─── Upload File to R2 ────────────────────────────────────────────────────────
async function uploadToR2(file, category) {
    // If R2 is not configured, use local storage
    if (!isR2Configured()) {
        console.warn('[R2] Storage not configured — using local storage for development.');
        const { uploadToLocal, FileCategory: LocalCategory } = await Promise.resolve().then(() => __importStar(require('./localStorage')));
        // Map R2 categories to local categories
        const localCategory = category;
        const result = await uploadToLocal(file, localCategory);
        return { key: result.key, size: result.size };
    }
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
    await r2Client.send(command);
    return {
        key,
        size: file.size,
    };
}
// ─── Generate Signed URL for Private Access ───────────────────────────────────
async function getSignedDownloadUrl(key, expiresInSeconds = 3600) {
    // If R2 not configured, return local URL
    if (!isR2Configured()) {
        const { getLocalUrl } = await Promise.resolve().then(() => __importStar(require('./localStorage')));
        return getLocalUrl(key);
    }
    // If key is a no-storage placeholder, return empty string
    if (key.startsWith('__no_storage__/')) {
        return '';
    }
    const command = new client_s3_1.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return await (0, s3_request_presigner_1.getSignedUrl)(r2Client, command, { expiresIn: expiresInSeconds });
}
// ─── Delete File from R2 ──────────────────────────────────────────────────────
async function deleteFromR2(key) {
    if (!isR2Configured() || key.startsWith('__no_storage__/')) {
        return; // Nothing to delete
    }
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    await r2Client.send(command);
}
// ─── Batch Delete ─────────────────────────────────────────────────────────────
async function batchDeleteFromR2(keys) {
    await Promise.all(keys.map(key => deleteFromR2(key)));
}
// ─── Check if R2 is Configured ────────────────────────────────────────────────
function isR2Configured() {
    return !!(process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_ENDPOINT);
}
// ─── Get Public URL (if configured) ───────────────────────────────────────────
function getPublicUrl(key) {
    if (process.env.R2_PUBLIC_URL) {
        return `${process.env.R2_PUBLIC_URL}/${key}`;
    }
    return `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
}
//# sourceMappingURL=r2storage.js.map