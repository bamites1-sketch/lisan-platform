/**
 * Cloudflare R2 Storage Service
 * 
 * Handles all file uploads, downloads, and deletions using Cloudflare R2 (S3-compatible).
 * Files are private by default and accessed via signed URLs.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// ─── R2 Client Configuration ──────────────────────────────────────────────────
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lisan-storage';

// ─── File Type Configurations ─────────────────────────────────────────────────
export enum FileCategory {
  RECORDING = 'recordings',
  RECEIPT = 'receipts',
  RESOURCE = 'resources',
}

interface FileTypeConfig {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  contentType: string;
}

const FILE_CONFIGS: Record<FileCategory, FileTypeConfig> = {
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
export function validateFile(
  file: Express.Multer.File,
  category: FileCategory
): { valid: boolean; error?: string } {
  const config = FILE_CONFIGS[category];
  const ext = path.extname(file.originalname).toLowerCase();

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
export function generateFileKey(category: FileCategory, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${category}/${timestamp}-${randomName}${ext}`;
}

// ─── Upload File to R2 ────────────────────────────────────────────────────────
export async function uploadToR2(
  file: Express.Multer.File,
  category: FileCategory
): Promise<{ key: string; size: number }> {
  // If R2 is not configured, use local storage
  if (!isR2Configured()) {
    console.warn('[R2] Storage not configured — using local storage for development.');
    const { uploadToLocal, FileCategory: LocalCategory } = await import('./localStorage');
    
    // Map R2 categories to local categories
    const localCategory = category as any;
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

  const command = new PutObjectCommand({
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
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  // If R2 not configured, return local URL
  if (!isR2Configured()) {
    const { getLocalUrl } = await import('./localStorage');
    return getLocalUrl(key);
  }

  // If key is a no-storage placeholder, return empty string
  if (key.startsWith('__no_storage__/')) {
    return '';
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

// ─── Delete File from R2 ──────────────────────────────────────────────────────
export async function deleteFromR2(key: string): Promise<void> {
  if (!isR2Configured() || key.startsWith('__no_storage__/')) {
    return; // Nothing to delete
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// ─── Batch Delete ─────────────────────────────────────────────────────────────
export async function batchDeleteFromR2(keys: string[]): Promise<void> {
  await Promise.all(keys.map(key => deleteFromR2(key)));
}

// ─── Check if R2 is Configured ────────────────────────────────────────────────
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ENDPOINT
  );
}

// ─── Get Public URL (if configured) ───────────────────────────────────────────
export function getPublicUrl(key: string): string {
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
  return `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
}
