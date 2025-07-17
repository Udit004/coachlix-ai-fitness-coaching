// utils/profileNotificationUtils.js

/**
 * Determines the type of profile update and generates appropriate notification data
 */
export function analyzeProfileUpdate(oldData, newData) {
    const changes = [];
    const significantChanges = [];
  
    // Define field categories and their significance
    const fieldCategories = {
      fitness_goal: { field: 'fitnessGoal', significant: true },
      target_weight: { field: 'targetWeight', significant: true },
      experience: { field: 'experience', significant: true },
      height: { field: 'height', significant: true },
      weight: { field: 'weight', significant: true },
      personal_info: { fields: ['name', 'phone', 'location', 'birthDate', 'bio'], significant: false }
    };
  
    // Check for changes in each category
    for (const [category, config] of Object.entries(fieldCategories)) {
      if (config.field) {
        // Single field check
        if (oldData[config.field] !== newData[config.field] && newData[config.field] !== undefined) {
          changes.push({
            category,
            field: config.field,
            oldValue: oldData[config.field],
            newValue: newData[config.field],
            significant: config.significant
          });
          
          if (config.significant) {
            significantChanges.push(category);
          }
        }
      } else if (config.fields) {
        // Multiple fields check
        const changedFields = config.fields.filter(field => 
          oldData[field] !== newData[field] && newData[field] !== undefined
        );
        
        if (changedFields.length > 0) {
          changes.push({
            category,
            fields: changedFields,
            significant: config.significant
          });
          
          if (config.significant) {
            significantChanges.push(category);
          }
        }
      }
    }
  
    return {
      changes,
      significantChanges,
      hasSignificantChanges: significantChanges.length > 0,
      primaryChangeType: significantChanges[0] || 'personal_info'
    };
  }
  
  /**
   * Generates notification content based on profile update analysis
   */
  export function generateNotificationContent(analysis, oldData, newData, isNewUser = false) {
    if (isNewUser) {
      return {
        title: "Welcome to Coachlix! 🎉",
        body: "Your profile has been created successfully. Start your fitness journey now!",
        type: 'profile_created',
        data: {
          action: 'created',
          link: '/dashboard'
        }
      };
    }
  
    const { primaryChangeType, changes } = analysis;
    
    // Generate specific notifications based on primary change type
    switch (primaryChangeType) {
      case 'fitness_goal':
        return {
          title: "Fitness Goal Updated! 🎯",
          body: `Your fitness goal has been changed to: ${newData.fitnessGoal}`,
          type: 'fitness_goal_updated',
          data: {
            action: 'fitness_goal_changed',
            newGoal: newData.fitnessGoal,
            oldGoal: oldData.fitnessGoal,
            link: '/profile'
          }
        };
  
      case 'target_weight':
        return {
          title: "Target Weight Updated! ⚖️",
          body: `Your target weight has been set to: ${newData.targetWeight} kg`,
          type: 'target_weight_updated',
          data: {
            action: 'target_weight_changed',
            newWeight: newData.targetWeight,
            oldWeight: oldData.targetWeight,
            link: '/profile'
          }
        };
  
      case 'experience':
        return {
          title: "Experience Level Updated! 💪",
          body: `Your experience level has been changed to: ${newData.experience}`,
          type: 'experience_updated',
          data: {
            action: 'experience_changed',
            newExperience: newData.experience,
            oldExperience: oldData.experience,
            link: '/profile'
          }
        };
  
      case 'weight':
        // Special handling for weight updates - check for progress
        const weightProgress = calculateWeightProgress(oldData, newData);
        if (weightProgress.hasProgress) {
          return {
            title: "Weight Updated! 📊",
            body: weightProgress.message,
            type: 'weight_progress',
            data: {
              action: 'weight_updated',
              ...weightProgress.data,
              link: '/profile'
            }
          };
        }
        return {
          title: "Weight Updated! ⚖️",
          body: `Your weight has been updated to: ${newData.weight} kg`,
          type: 'weight_updated',
          data: {
            action: 'weight_changed',
            newWeight: newData.weight,
            oldWeight: oldData.weight,
            link: '/profile'
          }
        };
  
      case 'height':
        return {
          title: "Height Updated! 📏",
          body: `Your height has been updated to: ${newData.height} cm`,
          type: 'height_updated',
          data: {
            action: 'height_changed',
            newHeight: newData.height,
            oldHeight: oldData.height,
            link: '/profile'
          }
        };
  
      default:
        return {
          title: "Profile Updated! ✅",
          body: "Your profile information has been successfully updated.",
          type: 'profile_updated',
          data: {
            action: 'profile_updated',
            changedFields: changes.map(c => c.field || c.fields).flat(),
            link: '/profile'
          }
        };
    }
  }
  
  /**
   * Calculates weight progress and generates appropriate message
   */
  export function calculateWeightProgress(oldData, newData) {
    const oldWeight = parseFloat(oldData.weight) || 0;
    const newWeight = parseFloat(newData.weight) || 0;
    const targetWeight = parseFloat(newData.targetWeight || oldData.targetWeight) || 0;
  
    if (!oldWeight || !newWeight || !targetWeight) {
      return { hasProgress: false };
    }
  
    const weightChange = oldWeight - newWeight;
    const totalWeightToLose = Math.abs(oldWeight - targetWeight);
    const progressPercentage = Math.min(Math.round((Math.abs(weightChange) / totalWeightToLose) * 100), 100);
  
    // Determine if this is progress towards goal
    const isProgress = (targetWeight < oldWeight && newWeight < oldWeight) || 
                      (targetWeight > oldWeight && newWeight > oldWeight);
  
    if (isProgress && Math.abs(weightChange) >= 0.5) {
      const direction = weightChange > 0 ? 'lost' : 'gained';
      const message = targetWeight < oldWeight 
        ? `Great progress! You've ${direction} ${Math.abs(weightChange).toFixed(1)} kg. You're ${progressPercentage}% closer to your goal!`
        : `Excellent! You've ${direction} ${Math.abs(weightChange).toFixed(1)} kg towards your target!`;
  
      return {
        hasProgress: true,
        message,
        data: {
          weightChange: weightChange.toFixed(1),
          progressPercentage,
          currentWeight: newWeight,
          targetWeight,
          direction
        }
      };
    }
  
    return { hasProgress: false };
  }
  
  /**
   * Determines if a profile update warrants a notification
   */
  export function shouldSendNotification(analysis, isNewUser) {
    // Always send notification for new users
    if (isNewUser) {
      return true;
    }
  
    // Send notification for significant changes
    if (analysis.hasSignificantChanges) {
      return true;
    }
  
    // Send notification if multiple fields changed
    if (analysis.changes.length >= 3) {
      return true;
    }
  
    return false;
  }
  
  /**
   * Generates activity log entry for profile updates
   */
  export function generateActivityLogEntry(analysis, isNewUser) {
    if (isNewUser) {
      return {
        type: 'profile_created',
        description: 'Profile created successfully',
        timestamp: new Date(),
        details: {
          action: 'created'
        }
      };
    }
  
    const { primaryChangeType, changes } = analysis;
    
    return {
      type: 'profile_updated',
      description: `Profile updated - ${primaryChangeType.replace('_', ' ')}`,
      timestamp: new Date(),
      details: {
        action: 'updated',
        primaryChange: primaryChangeType,
        updatedFields: changes.map(c => c.field || c.fields).flat(),
        changeCount: changes.length
      }
    };
  }
  
  /**
   * Check if user has reached any milestones after profile update
   */
  export function checkForMilestones(oldData, newData) {
    const milestones = [];
  
    // First profile completion
    if (!oldData.name && newData.name) {
      milestones.push({
        type: 'profile_completion',
        title: 'Profile Complete',
        description: 'You\'ve completed your profile setup!'
      });
    }
  
    // Goal setting milestone
    if (!oldData.fitnessGoal && newData.fitnessGoal) {
      milestones.push({
        type: 'goal_set',
        title: 'Goal Setter',
        description: 'You\'ve set your fitness goal! Time to crush it!'
      });
    }
  
    // Target weight milestone
    if (!oldData.targetWeight && newData.targetWeight) {
      milestones.push({
        type: 'target_set',
        title: 'Target Locked',
        description: 'You\'ve set your target weight. Let\'s achieve it together!'
      });
    }
  
    // Body stats completion
    if ((!oldData.height || !oldData.weight) && (newData.height && newData.weight)) {
      milestones.push({
        type: 'body_stats_complete',
        title: 'Body Stats Complete',
        description: 'Your body measurements are now complete!'
      });
    }
  
    // Weight loss milestone (if applicable)
    if (oldData.weight && newData.weight && newData.targetWeight) {
      const weightLost = parseFloat(oldData.weight) - parseFloat(newData.weight);
      if (weightLost >= 1) {
        milestones.push({
          type: 'weight_loss',
          title: 'Weight Loss Achievement',
          description: `You've lost ${weightLost.toFixed(1)} kg! Keep up the great work!`
        });
      }
    }
  
    return milestones;
  }