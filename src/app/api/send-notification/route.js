import admin from '../../../lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token, title, body, data, imageUrl } = await request.json();

    if (!token || !title || !body) {
      return NextResponse.json(
        { message: 'Token, title, and body are required' },
        { status: 400 }
      );
    }

    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl })
      },
      data: data || {},
      token,
      webpush: {
        fcmOptions: {
          link: data?.link || '/'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      messageId: response
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to send notification',
        error: error.message 
      },
      { status: 500 }
    );
  }
}