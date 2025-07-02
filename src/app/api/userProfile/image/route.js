// src/app/api/profile/image/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/userProfileModel';
import cloudinary from '@/lib/cloudinary';

export async function POST(request) {
  try {
    await connectDB();
    
    const userId = await getUserIdFromAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadRes = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'coachlix/profiles',
          public_id: `profile_${userId}`,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const imageUrl = uploadRes.secure_url;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: imageUrl,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrl
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract userId from Firebase token
import { verifyUserToken } from '@/lib/verifyUser';

async function getUserIdFromAuth(request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const idToken = authHeader.split(' ')[1];
    const decoded = await verifyUserToken(idToken);
    if (!decoded || !decoded.uid) return null;
    // Find user by firebaseUid
    const user = await User.findOne({ firebaseUid: decoded.uid });
    return user ? user._id : null;
  } catch (err) {
    console.error('getUserIdFromAuth error:', err);
    return null;
  }
}