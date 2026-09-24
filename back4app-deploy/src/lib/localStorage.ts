/**
 * Local File Storage Service
 * 
 * Handles file uploads for local development when R2 is not configured.
 * Files are stored in the uploads directory and served via express static middleware.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

// Get local URL for file
export function getLocalUrl(key: string, baseUrl: string = 'http://localhost:5000'): string {
  return `${baseUrl}/uploads/${key}`;
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