export async function POST(request) {
    try {
      const { tokens, title, body, data, imageUrl } = await request.json();
  
      if (!tokens || !Array.isArray(tokens) || !title || !body) {
        return NextResponse.json(
          { message: 'Tokens array, title, and body are required' },
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
        webpush: {
          fcmOptions: {
            link: data?.link || '/'
          }
        }
      };
  
      const response = await admin.messaging().sendEachForMulticast({
        ...message,
        tokens: tokens
      });
  
      console.log('Bulk notification sent:', response);
  
      return NextResponse.json({
        success: true,
        message: 'Bulk notifications sent',
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      });
  
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to send bulk notification',
          error: error.message 
        },
        { status: 500 }
      );
    }
  }