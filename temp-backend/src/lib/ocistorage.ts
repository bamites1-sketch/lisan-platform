/**
 * Oracle Cloud Object Storage Service
 * 
 * Handles all file uploads, downloads, and deletions using Oracle OCI Object Storage.
 * Compatible with S3 API (uses AWS SDK with OCI endpoints).
 * Files are private by default and accessed via signed URLs.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// ─── OCI Storage Client Configuration ─────────────────────────────────────────
const ociClient = new S3Client({
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

// ─── Upload File to OCI ───────────────────────────────────────────────────────
export async function uploadToOCI(
  file: Express.Multer.File,
  category: FileCategory
): Promise<{ key: string; size: number }> {
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

  await ociClient.send(command);

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
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(ociClient, command, { expiresIn: expiresInSeconds });
}

// ─── Delete File from OCI ─────────────────────────────────────────────────────
export async function deleteFromOCI(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await ociClient.send(command);
}

// ─── Batch Delete ─────────────────────────────────────────────────────────────
export async function batchDeleteFromOCI(keys: string[]): Promise<void> {
  await Promise.all(keys.map(key => deleteFromOCI(key)));
}

// ─── Check if OCI is Configured ───────────────────────────────────────────────
export function isOCIConfigured(): boolean {
  return !!(
    process.env.OCI_NAMESPACE &&
    process.env.OCI_ACCESS_KEY_ID &&
    process.env.OCI_SECRET_ACCESS_KEY &&
    process.env.OCI_BUCKET_NAME &&
    process.env.OCI_REGION
  );
}

// ─── Backward compatibility aliases for R2 code ───────────────────────────────
export const uploadToR2 = uploadToOCI;
export const deleteFromR2 = deleteFromOCI;
export const batchDeleteFromR2 = batchDeleteFromOCI;
export const isR2Configured = isOCIConfigured;
