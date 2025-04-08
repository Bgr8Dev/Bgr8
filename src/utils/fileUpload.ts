import { storage } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { validateFile } from './security';

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Validate file before upload
export const validateFileUpload = (file: File): FileValidationResult => {
  if (!validateFile(file)) {
    return {
      isValid: false,
      error: 'Invalid file. Please ensure your file meets the following requirements:\n' +
             '- File size must be less than 5MB\n' +
             '- File type must be: JPEG, PNG, or PDF'
    };
  }

  // Check for malicious file extensions
  const dangerousExtensions = [
    '.exe', '.dll', '.so', '.sh', '.bat', '.cmd', '.msi',
    '.vbs', '.js', '.php', '.py', '.pl', '.rb', '.asp'
  ];
  
  if (dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    return {
      isValid: false,
      error: 'This file type is not allowed for security reasons.'
    };
  }

  // Additional content type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.'
    };
  }

  return { isValid: true };
};

// Secure file upload function
export const secureFileUpload = async (
  file: File,
  path: string,
  userId: string
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate a secure filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const secureFilename = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Create storage reference with secure path
    const storageRef = ref(storage, `${path}/${secureFilename}`);
    
    // Upload file with content type validation
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
        uploadTimestamp: new Date().toISOString()
      }
    };

    await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(storageRef);

    return {
      success: true,
      url: downloadURL
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file. Please try again.'
    };
  }
};

// Virus scan simulation (in production, use a real antivirus service)
const simulateVirusScan = async (file: File): Promise<boolean> => {
  // This is a placeholder for actual virus scanning
  // In production, integrate with a service like Cloud Storage Security or ClamAV
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate scan time
  return true; // Assume file is clean
};

// Get secure file type from buffer
const getSecureFileType = (buffer: ArrayBuffer): string | null => {
  // Check file signatures (magic numbers)
  const arr = new Uint8Array(buffer).subarray(0, 4);
  const header = Array.from(arr).map(byte => byte.toString(16)).join('');

  // Common file signatures
  const signatures: Record<string, string> = {
    '89504e47': 'image/png', // PNG
    'ffd8ffe0': 'image/jpeg', // JPEG
    '25504446': 'application/pdf' // PDF
  };

  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (header.startsWith(signature)) {
      return mimeType;
    }
  }

  return null;
};

// Verify file integrity
export const verifyFileIntegrity = async (file: File): Promise<boolean> => {
  try {
    // Read file as array buffer
    const buffer = await file.arrayBuffer();
    
    // Verify file type matches extension
    const detectedType = getSecureFileType(buffer);
    if (!detectedType || detectedType !== file.type) {
      console.error('File type mismatch detected');
      return false;
    }

    // Simulate virus scan
    const isClean = await simulateVirusScan(file);
    if (!isClean) {
      console.error('File failed virus scan');
      return false;
    }

    return true;
  } catch (error) {
    console.error('File integrity check failed:', error);
    return false;
  }
}; 