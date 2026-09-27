"use strict";
/**
 * Local File Storage Service
 *
 * Handles file uploads for local development when R2 is not configured.
 * Files are stored in the uploads directory and served via express static middleware.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCategory = void 0;
exports.generateLocalFileKey = generateLocalFileKey;
exports.uploadToLocal = uploadToLocal;
exports.getLocalUrl = getLocalUrl;
exports.deleteLocalFile = deleteLocalFile;
exports.localFileExists = localFileExists;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const os_1 = __importDefault(require("os"));
const UPLOAD_DIR = process.env.VERCEL
    ? path_1.default.join(os_1.default.tmpdir(), 'uploads')
    : path_1.default.join(process.cwd(), 'uploads');
// Ensure upload directory exists safely
try {
    if (!fs_1.default.existsSync(UPLOAD_DIR)) {
        fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}
catch (e) {
    console.warn('[localStorage] Could not create UPLOAD_DIR:', e);
}
var FileCategory;
(function (FileCategory) {
    FileCategory["RECORDING"] = "recordings";
    FileCategory["RECEIPT"] = "receipts";
    FileCategory["RESOURCE"] = "resources";
})(FileCategory || (exports.FileCategory = FileCategory = {}));
// Generate file key for local storage
function generateLocalFileKey(category, originalName) {
    const ext = path_1.default.extname(originalName).toLowerCase();
    const randomName = crypto_1.default.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${category}/${timestamp}-${randomName}${ext}`;
}
// Upload file to local storage
async function uploadToLocal(file, category) {
    const key = generateLocalFileKey(category, file.originalname);
    const categoryDir = path_1.default.join(UPLOAD_DIR, category);
    // Ensure category directory exists
    if (!fs_1.default.existsSync(categoryDir)) {
        fs_1.default.mkdirSync(categoryDir, { recursive: true });
    }
    const filePath = path_1.default.join(UPLOAD_DIR, key);
    // Write file to disk
    fs_1.default.writeFileSync(filePath, file.buffer);
    return {
        key,
        size: file.size,
        localPath: filePath
    };
}
// Get local URL for file — in production, resolve from BACKEND_PUBLIC_URL env.
// Never returns a localhost URL in production — falls back to an empty string with a warning.
function getLocalUrl(key, baseUrl) {
    const resolvedBase = baseUrl ??
        process.env.BACKEND_PUBLIC_URL ??
        (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
    if (!resolvedBase) {
        console.warn(`[storage] getLocalUrl: no BACKEND_PUBLIC_URL configured in production. ` +
            `Returning empty URL for key "${key}". ` +
            `Set BACKEND_PUBLIC_URL=https://your-backend.example.com or configure Cloudflare R2.`);
        return '';
    }
    const trimmed = resolvedBase.endsWith('/')
        ? resolvedBase.slice(0, -1)
        : resolvedBase;
    return `${trimmed}/uploads/${key}`;
}
// Delete local file
function deleteLocalFile(key) {
    try {
        const filePath = path_1.default.join(UPLOAD_DIR, key);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Failed to delete local file:', error);
    }
}
// Check if file exists locally
function localFileExists(key) {
    const filePath = path_1.default.join(UPLOAD_DIR, key);
    return fs_1.default.existsSync(filePath);
}
//# sourceMappingURL=localStorage.js.map