import { NextResponse } from 'next/server';
import User from '@/models/userProfileModel';
import { connectDB } from '@/lib/db';
import { verifyUserToken } from '../../../lib/verifyUser';

export async function POST(request) {
    try {
      const { token } = await request.json();
      const authHeader = request.headers.get('authorization');
  
      console.log('=== FCM Token Save Request ===');
      console.log('Token received:', token ? 'Yes' : 'No');
      console.log('Auth header present:', authHeader ? 'Yes' : 'No');
      console.log('Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'None');
      
      if (!token) {
        console.log('❌ Token is required');
        return NextResponse.json({ message: 'Token is required' }, { status: 400 });
      }
  
      await connectDB();
      console.log('✅ Database connected');
  
      if (!authHeader) {
        console.log('❌ No auth header provided');
        return NextResponse.json({
          success: false,
          message: 'Authorization header is required'
        }, { status: 401 });
      }

      if (!authHeader.startsWith('Bearer ')) {
        console.log('❌ Invalid authorization format');
        return NextResponse.json({
          success: false,
          message: 'Invalid authorization format. Use: Bearer <token>'
        }, { status: 401 });
      }

      try {
        const cleanToken = authHeader.replace('Bearer ', '');
        console.log('🔍 Verifying token...');
        
        const user = await verifyUserToken(cleanToken);
        console.log('✅ User verified:', user.uid);

        // Find the user first to check if they exist
        const existingUser = await User.findOne({ firebaseUid: user.uid });
        console.log('Existing user found:', existingUser ? 'Yes' : 'No');
        
        if (existingUser) {
          console.log('Current pushToken:', existingUser.pushToken ? 'Has token' : 'No token');
        }

        const updatedUser = await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          { 
            pushToken: token, 
            lastLogin: new Date() 
          },
          { 
            upsert: true,
            new: true // Return the updated document
          }
        );

        console.log('✅ User updated successfully');
        console.log('Updated pushToken:', updatedUser.pushToken ? 'Token saved' : 'No token saved');
        console.log('User ID:', updatedUser._id);
        
        return NextResponse.json({
          success: true,
          message: 'Token saved successfully',
          userID: updatedUser._id,
          tokenSaved: updatedUser.pushToken ? 'Yes' : 'No'
        });

      } catch (error) {
        console.error('❌ Authentication error:', error.message);
        console.error('Error details:', error);
        
        return NextResponse.json({
          success: false,
          message: 'Authentication failed',
          error: error.message,
          details: 'Token verification failed'
        }, { status: 401 });
      }

    } catch (error) {
      console.error('❌ Server error:', error);
      return NextResponse.json({
        success: false,
        message: 'Internal server error',
        error: error.message
      }, { status: 500 });
    }
}

// Optional: Add a GET method to retrieve the current token for debugging
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('=== FCM Token GET Request ===');
    console.log('Auth header present:', authHeader ? 'Yes' : 'No');
    
    if (!authHeader) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Invalid authorization format' }, { status: 401 });
    }

    await connectDB();
    
    const cleanToken = authHeader.replace('Bearer ', '');
    const user = await verifyUserToken(cleanToken);
    
    const userProfile = await User.findOne({ firebaseUid: user.uid });
    
    if (!userProfile) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      pushToken: userProfile.pushToken,
      lastLogin: userProfile.lastLogin,
      hasToken: !!userProfile.pushToken
    });

  } catch (error) {
    console.error('Error retrieving token:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}