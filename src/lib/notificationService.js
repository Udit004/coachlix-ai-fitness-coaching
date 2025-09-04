// lib/notificationService.js - Improved NotificationService implementation
import admin from './firebaseAdmin';
import { connectDB } from './db';
import User from '@/models/userProfileModel';

export class NotificationService {
  // Send custom notification
  static async sendCustomNotification(token, title, body, data = {}) {
    try {
      if (!token) {
        console.error('❌ FCM token is required for notification');
        throw new Error('FCM token is required');
      }

      console.log('🔔 Attempting to send notification:', {
        token: token.substring(0, 20) + '...',
        title,
        body: body.substring(0, 50) + '...'
      });

      const message = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        token,
        webpush: {
          fcmOptions: {
            link: data.link || '/dashboard'
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Successfully sent notification:', response);
      return response;
    } catch (error) {
      console.error('❌ Error sending custom notification:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });

      // Auto-clean up invalid tokens to prevent repeated failures
      if (error.code === 'messaging/registration-token-not-registered') {
        try {
          await connectDB();
          const updateResult = await User.updateMany(
            { pushToken: token },
            { $unset: { pushToken: "" } }
          );
          console.log('🧹 Cleaned up invalid FCM token for users:', updateResult.modifiedCount);
        } catch (cleanupError) {
          console.error('Failed to clean up invalid FCM token:', cleanupError);
        }
      }
      throw error;
    }
  }

  // Send welcome notification
  static async sendWelcomeNotification(token) {
    console.log('🎉 Sending welcome notification to token:', token?.substring(0, 20) + '...');
    return this.sendCustomNotification(
      token,
      "Welcome to Coachlix! 🎉",
      "Your fitness journey starts now! Complete your profile to get personalized recommendations.",
      {
        type: 'welcome',
        link: '/profile'
      }
    );
  }

  // Send milestone notification
  static async sendMilestoneNotification(token, milestone) {
    console.log('🏆 Sending milestone notification:', milestone);
    return this.sendCustomNotification(
      token,
      `🏆 ${milestone}`,
      "Congratulations! You've reached a new milestone in your fitness journey!",
      {
        type: 'milestone',
        milestone,
        link: '/achievements'
      }
    );
  }

  // Send profile update notification
  static async sendProfileUpdateNotification(token, title, body, data = {}) {
    console.log('📝 Sending profile update notification:', title);
    return this.sendCustomNotification(token, title, body, {
      type: 'profile_update',
      ...data,
      link: '/profile'
    });
  }

  // Test notification method
  static async sendTestNotification(token) {
    console.log('🧪 Sending test notification');
    return this.sendCustomNotification(
      token,
      "Test Notification",
      "This is a test notification from Coachlix!",
      {
        type: 'test',
        link: '/dashboard'
      }
    );
  }
}