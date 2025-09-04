import { NextResponse } from 'next/server';
import User from '@/models/userProfileModel';
import { connectDB } from '@/lib/db';
import admin from '@/lib/firebaseAdmin';
import { verifyUserToken } from '@/lib/verifyUser';

// Helper to fetch the user's stored FCM token
async function getUserFCMToken(userId) {
  await connectDB();
  const user = await User.findOne({ firebaseUid: userId });
  return user?.pushToken;
}

export async function POST(request) {
  try {
    const { title, body, data, token: directToken } = await request.json();
    
    // Allow either a direct device token or an auth header for current user's token
    let fcmToken = directToken;

    if (!fcmToken) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
      }

      const idToken = authHeader.replace('Bearer ', '');
      const user = await verifyUserToken(idToken);

      // Get user's stored FCM token
      fcmToken = await getUserFCMToken(user.uid);
      if (!fcmToken) {
        return NextResponse.json({ message: 'No FCM token found for user' }, { status: 404 });
      }
    }
    
    // Send notification
    const message = {
      notification: { title, body },
      data: data || {},
      token: fcmToken,
      webpush: {
        fcmOptions: {
          link: data?.link || '/'
        }
      }
    };

    const response = await admin.messaging().send(message);
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      messageId: response
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to send notification',
      error: error.message 
    }, { status: 500 });
  }
}