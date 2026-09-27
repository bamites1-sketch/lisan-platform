/**
 * Local File Storage Service
 * 
 * Handles file uploads for local development when R2 is not configured.
 * Files are stored in the uploads directory and served via express static middleware.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(process.cwd(), 'uploads');

// Ensure upload directory exists safely
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[localStorage] Could not create UPLOAD_DIR:', e);
}

export enum FileCategory {
  RECORDING = 'recordings',
  RECEIPT = 'receipts',
  RESOURCE = 'resources',
}

// Generate file key for local storage
export function generateLocalFileKey(category: FileCategory, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${category}/${timestamp}-${randomName}${ext}`;
}

// Upload file to local storage
export async function uploadToLocal(
  file: Express.Multer.File,
  category: FileCategory
): Promise<{ key: string; size: number; localPath: string }> {
  const key = generateLocalFileKey(category, file.originalname);
  const categoryDir = path.join(UPLOAD_DIR, category);
  
  // Ensure category directory exists
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  
  const filePath = path.join(UPLOAD_DIR, key);
  
  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);
  
  return {
    key,
    size: file.size,
    localPath: filePath
  };
}

// Get local URL for file — in production, resolve from BACKEND_PUBLIC_URL env.
// Never returns a localhost URL in production — falls back to an empty string with a warning.
export function getLocalUrl(key: string, baseUrl?: string): string {
  const resolvedBase =
    baseUrl ??
    process.env.BACKEND_PUBLIC_URL ??
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

  if (!resolvedBase) {
    console.warn(
      `[storage] getLocalUrl: no BACKEND_PUBLIC_URL configured in production. ` +
        `Returning empty URL for key "${key}". ` +
        `Set BACKEND_PUBLIC_URL=https://your-backend.example.com or configure Cloudflare R2.`
    );
    return '';
  }

  const trimmed = resolvedBase.endsWith('/')
    ? resolvedBase.slice(0, -1)
    : resolvedBase;
  return `${trimmed}/uploads/${key}`;
}

// Delete local file
export function deleteLocalFile(key: string): void {
  try {
    const filePath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete local file:', error);
  }
}

// Check if file exists locally
export function localFileExists(key: string): boolean {
  const filePath = path.join(UPLOAD_DIR, key);
  return fs.existsSync(filePath);
}