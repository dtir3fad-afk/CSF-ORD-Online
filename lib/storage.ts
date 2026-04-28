/**
 * Firebase Storage Service
 * Handles file uploads for CSF documents
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

// Initialize storage with the app
function getStorageInstance() {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error('Firebase app is not initialized');
  }
  return getStorage(app);
}

export interface UploadResult {
  previewUrl: string;
  fullUrl: string;
  fileName: string;
}

/**
 * Upload a document file to Firebase Storage
 * In a real implementation, you'd create two versions:
 * 1. A preview version (first few pages or watermarked)
 * 2. The full document
 */
export const uploadDocument = async (file: File): Promise<UploadResult> => {
  try {
    const storage = getStorageInstance();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    
    // Create references for both preview and full versions
    const previewRef = ref(storage, `documents/previews/${fileName}`);
    const fullRef = ref(storage, `documents/full/${fileName}`);
    
    // For now, we'll upload the same file to both locations
    // In a real app, you'd process the file to create a preview version
    const [previewSnapshot, fullSnapshot] = await Promise.all([
      uploadBytes(previewRef, file),
      uploadBytes(fullRef, file)
    ]);
    
    // Get download URLs
    const [previewUrl, fullUrl] = await Promise.all([
      getDownloadURL(previewSnapshot.ref),
      getDownloadURL(fullSnapshot.ref)
    ]);
    
    return {
      previewUrl,
      fullUrl,
      fileName: file.name
    };
    
  } catch (error: any) {
    console.error('Error uploading document:', error);
    
    // Handle specific Firebase Storage errors
    if (error.code === 'storage/unauthorized') {
      throw new Error('Upload failed: Storage access denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Upload failed: Unknown error occurred. Please check your internet connection.');
    } else if (error.message?.includes('CORS')) {
      throw new Error('Upload failed: CORS error. Please configure Firebase Storage CORS settings. See scripts/setup-storage-cors.md for instructions.');
    } else {
      throw new Error(`Upload failed: ${error.message || 'Please try again.'}`);
    }
  }
};

/**
 * Generate a preview version of a document
 * This is a placeholder - in a real app you'd use a service like:
 * - PDF.js to extract first few pages
 * - ImageMagick to add watermarks
 * - A cloud service like Cloudinary
 */
export const generatePreview = async (file: File): Promise<File> => {
  // For now, return the same file
  // In production, implement actual preview generation
  return file;
};

/**
 * Validate uploaded file
 */
export const validateDocument = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB (reduced from 10MB for data URL storage)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF, DOC, and DOCX files are allowed.'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB when using data URL storage.'
    };
  }
  
  return { valid: true };
};