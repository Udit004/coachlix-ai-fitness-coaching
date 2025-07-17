// middleware/notificationMiddleware.js
import { NotificationService } from '@/lib/notificationService';
import User from '@/models/userProfileModel';

/**
 * Middleware to handle automatic notifications for profile actions
 */
export class ProfileNotificationMiddleware {
  
  /**
   * Send notification when profile is created
   */
  static async handleProfileCreated(userId, userData) {
    try {
      const user = await User.findOne({ firebaseUid: userId });
      
      if (user && user.pushToken) {
        // Send welcome notification
        await NotificationService.sendWelcomeNotification(user.pushToken);
        
        // Send profile created notification
        await NotificationService.sendProfileCreatedNotification(
          user.pushToken,
          userData.name || 'User'
        );
        
        console.log(`Profile creation notifications sent to user: ${userId}`);
      }
    } catch (error) {
      console.error('Error sending profile creation notifications:', error);
    }
  }

  /**
   * Send notification when profile is updated
   */
  static async handleProfileUpdated(userId, oldData, newData, updateType) {
    try {
      const user = await User.findOne({ firebaseUid: userId });
      
      if (user && user.pushToken) {
        let notificationData = {};
        
        // Determine notification details based on update type
        switch (updateType) {
          case 'fitness_goal':
            notificationData = {
              newGoal: newData.fitnessGoal,
              oldGoal: oldData.fitnessGoal
            };
            break;
          case 'target_weight':
            notificationData = {
              newWeight: newData.targetWeight,
              oldWeight: oldData.targetWeight
            };
            break;
          case 'experience':
            notificationData = {
              newExperience: newData.experience,
              oldExperience: oldData.experience
            };
            break;
        }
        
        await NotificationService.sendProfileUpdateNotification(
          user.pushToken,
          updateType,
          notificationData
        );
        
        console.log(`Profile update notification sent to user: ${userId}`);
      }
    } catch (error) {
      console.error('Error sending profile update notifications:', error);
    }
  }

  /**
   * Send notification for weight progress
   */
  static async handleWeightProgress(userId, progressData) {
    try {
      const user = await User.findOne({ firebaseUid: userId });
      
      if (user && user.pushToken) {
        await NotificationService.sendGoalProgressNotification(
          user.pushToken,
          progressData
        );
        
        console.log(`Weight progress notification sent to user: ${userId}`);
      }
    } catch (error) {
      console.error('Error sending weight progress notifications:', error);
    }
  }

  /**
   * Send milestone achievement notification
   */
  static async handleMilestoneAchieved(userId, milestone) {
    try {
      const user = await User.findOne({ firebaseUid: userId });
      
      if (user && user.pushToken) {
        await NotificationService.sendMilestoneNotification(
          user.pushToken,
          milestone.title
        );
        
        console.log(`Milestone notification sent to user: ${userId}`);
      }
    } catch (error) {
      console.error('Error sending milestone notifications:', error);
    }
  }

  /**
   * Send daily motivation notification
   */
  static async sendDailyMotivationToUser(userId) {
    try {
      const user = await User.findOne({ firebaseUid: userId });
      
      if (user && user.pushToken) {
        await NotificationService.sendDailyMotivation(
          user.pushToken,
          user.name || 'User'
        );
        
        console.log(`Daily motivation sent to user: ${userId}`);
      }
    } catch (error) {
      console.error('Error sending daily motivation:', error);
    }
  }

  /**
   * Send bulk notifications to all users
   */
  static async sendBulkNotificationToAllUsers(title, body, data = {}) {
    try {
      // Get all users with push tokens
      const users = await User.find({ 
        pushToken: { $exists: true, $ne: null } 
      }).select('pushToken');
      
      if (users.length === 0) {
        console.log('No users with push tokens found');
        return;
      }
      
      const tokens = users.map(user => user.pushToken);
      
      // Send bulk notification
      const result = await NotificationService.sendBulkNotification(
        tokens,
        title,
        body,
        data
      );
      
      console.log(`Bulk notification sent to ${tokens.length} users`);
      return result;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
    }
  }

  /**
   * Send notification to specific users by Firebase UIDs
   */
  static async sendNotificationToUsers(userIds, title, body, data = {}) {
    try {
      const users = await User.find({ 
        firebaseUid: { $in: userIds },
        pushToken: { $exists: true, $ne: null } 
      }).select('firebaseUid pushToken');
      
      if (users.length === 0) {
        console.log('No users with push tokens found for the specified IDs');
        return;
      }
      
      const tokens = users.map(user => user.pushToken);
      
      const result = await NotificationService.sendBulkNotification(
        tokens,
        title,
        body,
        data
      );
      
      console.log(`Notification sent to ${tokens.length} specific users`);
      return result;
    } catch (error) {
      console.error('Error sending notifications to specific users:', error);
    }
  }

  /**
   * Schedule daily motivational notifications
   */
  static async scheduleDailyMotivations() {
    try {
      const users = await User.find({ 
        pushToken: { $exists: true, $ne: null } 
      }).select('firebaseUid pushToken name');
      
      for (const user of users) {
        // Send daily motivation (you'd typically use a cron job for this)
        await NotificationService.sendDailyMotivation(
          user.pushToken,
          user.name || 'User'
        );
      }
      
      console.log(`Daily motivations sent to ${users.length} users`);
    } catch (error) {
      console.error('Error scheduling daily motivations:', error);
    }
  }

  /**
   * Clean up invalid FCM tokens
   */
  static async cleanupInvalidTokens() {
    try {
      // You would implement logic to test tokens and remove invalid ones
      // This is a placeholder for token validation
      console.log('Token cleanup process initiated');
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
    }
  }
}

// Usage example in your routes:
/*
// In your profile creation route:
await ProfileNotificationMiddleware.handleProfileCreated(userId, userData);

// In your profile update route:
await ProfileNotificationMiddleware.handleProfileUpdated(userId, oldData, newData, 'fitness_goal');

// For weight progress:
await ProfileNotificationMiddleware.handleWeightProgress(userId, {
  currentWeight: 70,
  targetWeight: 65,
  weightLost: 5,
  progressPercentage: 50
});

// For milestone achievements:
await ProfileNotificationMiddleware.handleMilestoneAchieved(userId, {
  title: 'First Workout Complete',
  description: 'You completed your first workout!'
});
*/