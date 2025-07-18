// Add this function to get user's FCM token
async function getUserFCMToken(userId) {
  await connectDB();
  const user = await User.findOne({ firebaseUid: userId });
  return user?.pushToken;
}

export async function POST(request) {
  try {
    const { title, body, data } = await request.json();
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyUserToken(token);
    
    // Get user's FCM token
    const fcmToken = await getUserFCMToken(user.uid);
    if (!fcmToken) {
      return NextResponse.json({ message: 'No FCM token found for user' }, { status: 404 });
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