// app/api/upload/route.js - File upload API route with Cloudinary

import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

/**
 * Supported file types and their MIME types
 */
const ALLOWED_TYPES = {
  // Images
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  // Documents
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'text/plain': true,
};

/**
 * Maximum file sizes (in bytes)
 */
const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
};

/**
 * POST /api/upload
 * Handles file uploads from the chat interface
 * Uploads to Cloudinary for cloud storage
 */
export async function POST(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} is not supported`,
        },
        { status: 400 }
      );
    }

    // Determine file category
    const isImage = file.type.startsWith('image/');
    const category = isImage ? 'image' : 'document';

    // Validate file size
    const maxSize = isImage ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.document;

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${maxSizeMB}MB limit`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    console.log(`[Upload API] Uploading ${category}: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
    
    const uploadRes = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `coachlix/chat-uploads/${category}s`, // coachlix/chat-uploads/images or /documents
          resource_type: isImage ? 'image' : 'raw', // 'raw' for non-image files
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            console.error('[Upload API] Cloudinary error:', error);
            reject(error);
          } else {
            console.log('[Upload API] Upload successful:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });

    // Convert to base64 for AI processing
    const base64 = buffer.toString('base64');

    // Return file metadata and base64 data
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        category: category,
        url: uploadRes.secure_url, // Cloudinary URL
        cloudinaryId: uploadRes.public_id,
        base64: base64, // For AI processing
        timestamp: new Date().toISOString(),
        // Additional Cloudinary metadata
        width: uploadRes.width,
        height: uploadRes.height,
        format: uploadRes.format,
      },
    });
  } catch (error) {
    console.error('[Upload API] Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Returns upload configuration and limits
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    config: {
      allowedTypes: Object.keys(ALLOWED_TYPES),
      maxSizes: {
        image: `${MAX_FILE_SIZE.image / (1024 * 1024)}MB`,
        document: `${MAX_FILE_SIZE.document / (1024 * 1024)}MB`,
      },
      storage: 'cloudinary',
      folder: 'coachlix/chat-uploads',
    },
  });
}

