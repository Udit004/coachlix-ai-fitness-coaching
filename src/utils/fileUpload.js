// utils/fileUpload.js - File upload utilities for client-side

/**
 * Supported file types for the chatbot
 */
export const SUPPORTED_FILE_TYPES = {
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
  },
  documents: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
  },
};

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
};

/**
 * Get all supported MIME types
 */
export const getAllSupportedMimeTypes = () => {
  return [
    ...Object.keys(SUPPORTED_FILE_TYPES.images),
    ...Object.keys(SUPPORTED_FILE_TYPES.documents),
  ];
};

/**
 * Get all supported file extensions
 */
export const getAllSupportedExtensions = () => {
  const imageExts = Object.values(SUPPORTED_FILE_TYPES.images).flat();
  const docExts = Object.values(SUPPORTED_FILE_TYPES.documents).flat();
  return [...imageExts, ...docExts];
};

/**
 * Validate file type
 * @param {File} file - File object to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateFileType = (file) => {
  const supportedTypes = getAllSupportedMimeTypes();
  
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Supported types: ${getAllSupportedExtensions().join(', ')}`,
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate file size
 * @param {File} file - File object to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateFileSize = (file) => {
  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document;
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Validate file
 * @param {File} file - File object to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateFile = (file) => {
  // Check file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  // Check file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  return { valid: true, error: null };
};

/**
 * Convert file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Read file as data URL (for preview)
 * @param {File} file - File to read
 * @returns {Promise<string>} - Data URL string
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file type category
 * @param {string} mimeType - MIME type of the file
 * @returns {string} - 'image' or 'document'
 */
export const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'document';
};

/**
 * Upload file to server using Axios
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Upload result
 */
export const uploadFile = async (file, onProgress) => {
  // Lazy import axios to avoid bundling if not needed
  const axios = (await import('axios')).default;
  
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentComplete = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          onProgress(percentComplete);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    // Handle different error types
    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.error || 
                          `Upload failed with status ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error during upload');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      throw new Error('Upload timeout - file too large or slow connection');
    } else {
      // Other errors
      throw new Error(error.message || 'Upload failed');
    }
  }
};

/**
 * Create file metadata object
 * @param {File} file - File object
 * @param {string} uploadedUrl - URL of uploaded file (optional)
 * @returns {Object} - File metadata
 */
export const createFileMetadata = (file, uploadedUrl = null) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    category: getFileCategory(file.type),
    lastModified: file.lastModified,
    url: uploadedUrl,
    timestamp: new Date().toISOString(),
  };
};
