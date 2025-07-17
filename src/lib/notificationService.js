// lib/notificationService.js - Complete NotificationService implementation
import admin from './firebaseAdmin';

export class NotificationService {
  // Send custom notification
  static async sendCustomNotification(token, title, body, data = {}) {
    try {
      if (!token) {
        throw new Error('FCM token is required');
      }

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
      console.log('Successfully sent notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending custom notification:', error);
      throw error;
    }
  }

  // Send welcome notification
  static async sendWelcomeNotification(token) {
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
    return this.sendCustomNotification(token, title, body, {
      type: 'profile_update',
      ...data,
      link: '/profile'
    });
  }
}


