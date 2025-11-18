// src/ai/search/contextRetrieval.js - Comprehensive User Data Retrieval
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";
import DietPlan from "../../models/DietPlan";
import WorkoutPlan from "../../models/WorkoutPlan";
import FitnessEmbedding from "../../models/FitnessEmbedding";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

/**
 * Enhanced context retrieval with detailed user data
 * @param {string} userId - Firebase UID
 * @param {string} userQuery - User's message/question
 * @param {number} maxLength - Maximum context length
 * @returns {Object} Comprehensive context from all sources
 */
export async function getEnhancedUserContext(userId, userQuery, maxLength = 3000) {
  try {
    await connectDB();
    
    // Get all context in parallel with enhanced detail
    const [profileContext, dietContext, workoutContext, progressContext, vectorContext] = await Promise.all([
      getDetailedUserProfile(userId, userQuery),
      getDetailedDietContext(userId, userQuery),
      getDetailedWorkoutContext(userId, userQuery),
      getUserProgressContext(userId),
      getRelevantVectorContent(userQuery, userId)
    ]);

    // Combine all contexts intelligently
    const combinedContext = combineEnhancedContexts({
      profile: profileContext,
      diet: dietContext,
      workout: workoutContext,
      progress: progressContext,
      vector: vectorContext
    }, maxLength);

    return combinedContext;
    
  } catch (error) {
    console.error("Error retrieving enhanced context:", error);
    return {
      profile: "Error loading profile context",
      diet: "Error loading diet context",
      workout: "Error loading workout context",
      progress: "Error loading progress context",
      combined: "Error loading comprehensive user context"
    };
  }
}

/**
 * Get detailed user profile with all relevant information
 */
async function getDetailedUserProfile(userId, query) {
  try {
    const user = await User.findOne({ firebaseUid: userId })
      .populate('achievements')
      .lean();
    
    if (!user) return "No user profile found";

    const queryLower = query.toLowerCase();
    let context = `=== USER PROFILE ===\n`;
    context += `Name: ${user.name || 'User'}\n`;
    
    // Basic Info
    if (user.age || user.birthDate) {
      const age = user.age || calculateAge(user.birthDate);
      context += `Age: ${age} years\n`;
    }
    if (user.gender) context += `Gender: ${user.gender}\n`;
    if (user.height) context += `Height: ${user.height}\n`;
    if (user.weight) context += `Current Weight: ${user.weight}\n`;
    if (user.targetWeight) context += `Target Weight: ${user.targetWeight}\n`;
    
    // Goals and Preferences
    if (user.fitnessGoal) context += `Primary Fitness Goal: ${user.fitnessGoal}\n`;
    if (user.experience) context += `Experience Level: ${user.experience}\n`;
    if (user.dietaryPreference) context += `Dietary Preference: ${user.dietaryPreference}\n`;
    if (user.allergies && user.allergies.length > 0) {
      context += `Allergies: ${user.allergies.join(', ')}\n`;
    }
    if (user.medicalConditions && user.medicalConditions.length > 0) {
      context += `Medical Conditions: ${user.medicalConditions.join(', ')}\n`;
    }
    
    // Equipment and Preferences
    if (user.availableEquipment && user.availableEquipment.length > 0) {
      context += `Available Equipment: ${user.availableEquipment.join(', ')}\n`;
    }
    if (user.workoutPreferences) {
      context += `Workout Preferences:\n`;
      if (user.workoutPreferences.preferredTime) {
        context += `  - Preferred Time: ${user.workoutPreferences.preferredTime}\n`;
      }
      if (user.workoutPreferences.duration) {
        context += `  - Preferred Duration: ${user.workoutPreferences.duration}\n`;
      }
      if (user.workoutPreferences.intensity) {
        context += `  - Preferred Intensity: ${user.workoutPreferences.intensity}\n`;
      }
    }
    
    // Stats and Achievements
    if (user.stats) {
      context += `Current Stats:\n`;
      context += `  - Workouts Completed: ${user.stats.workoutsCompleted || 0}\n`;
      context += `  - Current Streak: ${user.stats.daysStreak || 0} days\n`;
      context += `  - Total Calories Burned: ${user.stats.caloriesBurned || 0}\n`;
      context += `  - Total Exercise Time: ${user.stats.totalExerciseTime || 0} minutes\n`;
      context += `  - Average Workout Duration: ${user.stats.averageWorkoutDuration || 0} minutes\n`;
    }
    
    // Recent Achievements (query-specific)
    if (user.achievements && user.achievements.length > 0) {
      const earnedAchievements = user.achievements.filter(a => a.earned);
      if (earnedAchievements.length > 0) {
        context += `Recent Achievements:\n`;
        earnedAchievements.slice(-5).forEach(achievement => {
          context += `  - ${achievement.title}: ${achievement.description}\n`;
        });
      }
    }
    
    // Recent Activities (last 7 days)
    if (user.recentActivities && user.recentActivities.length > 0) {
      const recentActivities = user.recentActivities
        .filter(activity => {
          const activityDate = new Date(activity.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return activityDate > weekAgo;
        })
        .slice(0, 10);
      
      if (recentActivities.length > 0) {
        context += `Recent Activities (Last 7 Days):\n`;
        recentActivities.forEach(activity => {
          const date = new Date(activity.date).toLocaleDateString();
          context += `  - [${date}] ${activity.title} (${activity.type})\n`;
          if (activity.description) {
            context += `    ${activity.description}\n`;
          }
        });
      }
    }
    
    if (user.bio) context += `Personal Notes: ${user.bio}\n`;
    
    return context;
    
  } catch (error) {
    console.error("Error getting detailed user profile:", error);
    return "Error loading detailed user profile";
  }
}

/**
 * Get comprehensive diet plan context with meal details
 */
async function getDetailedDietContext(userId, query) {
  try {
    const dietPlans = await DietPlan.find({ 
      userId, 
      isActive: true 
    })
    .populate('days.meals.items')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

    if (!dietPlans || dietPlans.length === 0) {
      return "No active diet plans found";
    }

    const queryLower = query.toLowerCase();
    let context = `\n=== DIET PLANS ===\n`;

    for (const plan of dietPlans) {
      context += `\n📋 Diet Plan: "${plan.name}"\n`;
      context += `Goal: ${plan.goal}\n`;
      context += `Duration: ${plan.duration} days\n`;
      context += `Current Day: ${plan.currentDay || 1}/${plan.duration}\n`;
      context += `Status: ${plan.isActive ? 'Active' : 'Inactive'}\n`;
      
      context += `Daily Targets:\n`;
      context += `  - Calories: ${plan.targetCalories} kcal\n`;
      context += `  - Protein: ${plan.targetProtein}g\n`;
      context += `  - Carbs: ${plan.targetCarbs}g\n`;
      context += `  - Fats: ${plan.targetFats}g\n`;
      
      if (plan.days && plan.days.length > 0) {
        const currentDayIndex = (plan.currentDay || 1) - 1;
        const currentDay = plan.days[currentDayIndex] || plan.days[0];
        
        if (currentDay && currentDay.meals && currentDay.meals.length > 0) {
          context += `\nToday's Meal Plan (Day ${currentDay.dayNumber || 1}):\n`;
          
          currentDay.meals.forEach(meal => {
            context += `\n🍽️ ${meal.type} (${meal.totalCalories || 0} cal, ${meal.totalProtein || 0}g protein):\n`;
            
            if (meal.items && meal.items.length > 0) {
              meal.items.forEach(item => {
                context += `  - ${item.name}: ${item.quantity}${item.unit || ''}\n`;
                context += `    └ ${item.calories || 0} cal, ${item.protein || 0}g protein, ${item.carbs || 0}g carbs, ${item.fats || 0}g fats\n`;
                if (item.notes) {
                  context += `    └ Notes: ${item.notes}\n`;
                }
              });
            }
            
            if (meal.instructions) {
              context += `  Instructions: ${meal.instructions}\n`;
            }
          });
          
          const dayTotals = currentDay.totals || calculateDayTotals(currentDay.meals);
          context += `\nDay Totals:\n`;
          context += `  - Total Calories: ${dayTotals.calories || 0} / ${plan.targetCalories}\n`;
          context += `  - Total Protein: ${dayTotals.protein || 0}g / ${plan.targetProtein}g\n`;
          context += `  - Total Carbs: ${dayTotals.carbs || 0}g / ${plan.targetCarbs}g\n`;
          context += `  - Total Fats: ${dayTotals.fats || 0}g / ${plan.targetFats}g\n`;
        }
      }
      
      if (plan.weeklyAverages) {
        context += `\nWeekly Progress:\n`;
        context += `  - Average Daily Calories: ${plan.weeklyAverages.calories || 0}\n`;
        context += `  - Average Protein: ${plan.weeklyAverages.protein || 0}g\n`;
        context += `  - Adherence Rate: ${plan.weeklyAverages.adherence || 0}%\n`;
      }
      
      if (queryLower.includes('food') || queryLower.includes('eat') || queryLower.includes('meal')) {
        const recentFoodLogs = await getRecentFoodLogs(userId, 7);
        if (recentFoodLogs.length > 0) {
          context += `\nRecent Food Intake (Last 7 days):\n`;
          recentFoodLogs.slice(0, 10).forEach(log => {
            const date = new Date(log.date).toLocaleDateString();
            context += `  - [${date}] ${log.foodName}: ${log.calories} cal, ${log.protein}g protein\n`;
          });
        }
      }
    }

    return context;
    
  } catch (error) {
    console.error("Error getting detailed diet context:", error);
    return "Error loading detailed diet context";
  }
}

/**
 * Get comprehensive workout plan context with exercise details
 */
async function getDetailedWorkoutContext(userId, query) {
  try {
    const workoutPlans = await WorkoutPlan.find({ 
      userId, 
      isActive: true 
    })
    .populate('weeks.days.workouts.exercises')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

    if (!workoutPlans || workoutPlans.length === 0) {
      return "No active workout plans found";
    }

    const queryLower = query.toLowerCase();
    let context = `\n=== WORKOUT PLANS ===\n`;

    for (const plan of workoutPlans) {
      context += `\n💪 Workout Plan: "${plan.name}"\n`;
      context += `Goal: ${plan.goal}\n`;
      context += `Difficulty: ${plan.difficulty}\n`;
      context += `Duration: ${plan.duration} weeks\n`;
      context += `Current Week: ${plan.currentWeek || 1}/${plan.duration}\n`;
      context += `Frequency: ${plan.workoutFrequency}x per week\n`;
      context += `Status: ${plan.isActive ? 'Active' : 'Inactive'}\n`;
      
      if (plan.targetMuscleGroups && plan.targetMuscleGroups.length > 0) {
        context += `Target Muscle Groups: ${plan.targetMuscleGroups.join(', ')}\n`;
      }
      
      if (plan.equipment && plan.equipment.length > 0) {
        context += `Required Equipment: ${plan.equipment.join(', ')}\n`;
      }
      
      if (plan.weeks && plan.weeks.length > 0) {
        const currentWeekIndex = (plan.currentWeek || 1) - 1;
        const currentWeek = plan.weeks[currentWeekIndex] || plan.weeks[0];
        
        if (currentWeek && currentWeek.days) {
          context += `\n📅 Current Week (Week ${currentWeek.weekNumber || 1}) Schedule:\n`;
          
          currentWeek.days.forEach((day, dayIndex) => {
            const dayName = getDayName(dayIndex);
            
            if (day.isRestDay) {
              context += `${dayName}: 🛌 Rest Day\n`;
              if (day.notes) {
                context += `  Notes: ${day.notes}\n`;
              }
            } else if (day.workouts && day.workouts.length > 0) {
              context += `${dayName}: 🏋️ Workout Day\n`;
              
              day.workouts.forEach(workout => {
                context += `  Workout: ${workout.name} (${workout.type})\n`;
                context += `  Duration: ${workout.estimatedDuration || 'N/A'} minutes\n`;
                
                if (workout.exercises && workout.exercises.length > 0) {
                  context += `  Exercises:\n`;
                  workout.exercises.forEach(exercise => {
                    context += `    - ${exercise.name}\n`;
                    context += `      └ Target: ${exercise.targetMuscle || 'N/A'}\n`;
                    
                    if (exercise.sets && exercise.sets.length > 0) {
                      context += `      └ Sets: `;
                      exercise.sets.forEach((set, setIndex) => {
                        if (setIndex > 0) context += ', ';
                        context += `${set.reps || 'N/A'}`;
                        if (set.weight) context += ` @ ${set.weight}`;
                        if (set.duration) context += ` for ${set.duration}s`;
                      });
                      context += `\n`;
                    } else if (exercise.defaultSets) {
                      context += `      └ Sets: ${exercise.defaultSets} x ${exercise.defaultReps || 'N/A'}\n`;
                    }
                    
                    if (exercise.restTime) {
                      context += `      └ Rest: ${exercise.restTime}s between sets\n`;
                    }
                    if (exercise.instructions) {
                      context += `      └ Instructions: ${exercise.instructions}\n`;
                    }
                  });
                }
                
                if (workout.notes) {
                  context += `  Notes: ${workout.notes}\n`;
                }
              });
            }
          });
        }
      }
      
      if (plan.stats) {
        context += `\nProgress Statistics:\n`;
        context += `  - Total Workouts Completed: ${plan.stats.totalWorkouts || 0}\n`;
        context += `  - Completion Rate: ${plan.stats.completionRate || 0}%\n`;
        context += `  - Average Workout Duration: ${plan.stats.averageWorkoutDuration || 0} minutes\n`;
        context += `  - Total Calories Burned: ${plan.stats.totalCaloriesBurned || 0}\n`;
        context += `  - Consistency Score: ${plan.stats.consistencyScore || 0}%\n`;
      }
      
      const recentWorkoutLogs = await getRecentWorkoutLogs(userId, 14);
      if (recentWorkoutLogs.length > 0) {
        context += `\nRecent Workout History (Last 14 days):\n`;
        recentWorkoutLogs.slice(0, 10).forEach(log => {
          const date = new Date(log.date).toLocaleDateString();
          context += `  - [${date}] ${log.workoutName}: ${log.duration} min, ${log.caloriesBurned || 0} cal burned\n`;
          if (log.notes) {
            context += `    └ Notes: ${log.notes}\n`;
          }
        });
      }
    }

    return context;
    
  } catch (error) {
    console.error("Error getting detailed workout context:", error);
    return "Error loading detailed workout context";
  }
}

/**
 * Get user progress and trends
 */
async function getUserProgressContext(userId) {
  try {
    const [weightLogs, measurementLogs, progressPhotos] = await Promise.all([
      getRecentWeightLogs(userId, 30),
      getRecentMeasurementLogs(userId, 30),
      getRecentProgressPhotos(userId, 5)
    ]);

    let context = `\n=== PROGRESS TRACKING ===\n`;

    if (weightLogs.length > 0) {
      context += `Weight Progress (Last 30 days):\n`;
      const sortedWeights = weightLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latestWeight = sortedWeights[0];
      const oldestWeight = sortedWeights[sortedWeights.length - 1];
      
      context += `  - Current Weight: ${latestWeight.weight}${latestWeight.unit || 'kg'}\n`;
      if (sortedWeights.length > 1) {
        const weightChange = parseFloat(latestWeight.weight) - parseFloat(oldestWeight.weight);
        const trend = weightChange > 0 ? 'gained' : weightChange < 0 ? 'lost' : 'maintained';
        context += `  - Change: ${trend} ${Math.abs(weightChange).toFixed(1)}${latestWeight.unit || 'kg'} in ${sortedWeights.length} entries\n`;
      }
      
      context += `  - Recent Entries:\n`;
      sortedWeights.slice(0, 5).forEach(log => {
        const date = new Date(log.date).toLocaleDateString();
        context += `    └ [${date}] ${log.weight}${log.unit || 'kg'}\n`;
      });
    }

    if (measurementLogs.length > 0) {
      context += `\nBody Measurements Progress:\n`;
      const latestMeasurements = measurementLogs[0];
      context += `  - Latest measurements (${new Date(latestMeasurements.date).toLocaleDateString()}):\n`;
      if (latestMeasurements.chest) context += `    └ Chest: ${latestMeasurements.chest}cm\n`;
      if (latestMeasurements.waist) context += `    └ Waist: ${latestMeasurements.waist}cm\n`;
      if (latestMeasurements.hips) context += `    └ Hips: ${latestMeasurements.hips}cm\n`;
      if (latestMeasurements.biceps) context += `    └ Biceps: ${latestMeasurements.biceps}cm\n`;
      if (latestMeasurements.bodyFat) context += `    └ Body Fat: ${latestMeasurements.bodyFat}%\n`;
    }

    if (progressPhotos.length > 0) {
      context += `\nProgress Photos: ${progressPhotos.length} photos available\n`;
      const latest = progressPhotos[0];
      context += `  - Latest photo: ${new Date(latest.date).toLocaleDateString()}\n`;
    }

    return context;
    
  } catch (error) {
    console.error("Error getting progress context:", error);
    return "Error loading progress context";
  }
}

/**
 * Get relevant content from vector database based on query
 */
async function getRelevantVectorContent(query, userId) {
  try {
    const user = await User.findOne({ firebaseUid: userId }).select('fitnessGoal experience equipment').lean();
    
    const vectorResults = await FitnessEmbedding.findByMetadata({
      plan: user?.fitnessGoal?.toLowerCase().includes('weight loss') ? 'weight-loss' :
            user?.fitnessGoal?.toLowerCase().includes('muscle gain') ? 'muscle-gain' : 'general'
    });

    let context = `\n=== RELEVANT KNOWLEDGE BASE ===\n`;
    
    if (vectorResults.length > 0) {
      vectorResults.slice(0, 3).forEach(result => {
        context += `\n📚 ${result.metadata.title}:\n`;
        context += `${result.content}\n`;
      });
    }

    return context;
    
  } catch (error) {
    console.error("Error getting vector content:", error);
    return "";
  }
}

/**
 * Combine all contexts intelligently with prioritization
 */
function combineEnhancedContexts(contexts, maxLength = 3000) {
  const { profile, diet, workout, progress, vector } = contexts;
  
  const prioritizedContexts = [
    { name: 'profile', content: profile, priority: 1, minLength: 300 },
    { name: 'diet', content: diet, priority: 2, minLength: 500 },
    { name: 'workout', content: workout, priority: 2, minLength: 500 },
    { name: 'progress', content: progress, priority: 3, minLength: 200 },
    { name: 'knowledge', content: vector, priority: 4, minLength: 200 }
  ].filter(ctx => ctx.content && ctx.content.length > 50);

  let combinedContext = "\n🎯 === COMPREHENSIVE USER CONTEXT ===\n";
  let remainingLength = maxLength - combinedContext.length;

  for (const ctx of prioritizedContexts.filter(c => c.priority <= 2)) {
    if (remainingLength > ctx.minLength) {
      combinedContext += ctx.content;
      remainingLength -= ctx.content.length;
    } else {
      const truncated = ctx.content.substring(0, remainingLength - 50) + "...\n";
      combinedContext += truncated;
      remainingLength -= truncated.length;
      break;
    }
  }

  for (const ctx of prioritizedContexts.filter(c => c.priority > 2)) {
    if (remainingLength > ctx.minLength) {
      combinedContext += ctx.content;
      remainingLength -= ctx.content.length;
    }
  }

  combinedContext += "\n=== END COMPREHENSIVE CONTEXT ===\n";

  return {
    profile: profile,
    diet: diet,
    workout: workout,
    progress: progress,
    knowledge: vector,
    combined: combinedContext,
    totalLength: combinedContext.length,
    contextSections: prioritizedContexts.length
  };
}

// Helper functions
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getDayName(index) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[index] || `Day ${index + 1}`;
}

function calculateDayTotals(meals) {
  return meals.reduce((totals, meal) => {
    totals.calories += meal.totalCalories || 0;
    totals.protein += meal.totalProtein || 0;
    totals.carbs += meal.totalCarbs || 0;
    totals.fats += meal.totalFats || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

// Database query helper functions (implement based on your schema)
async function getRecentFoodLogs(userId, days) {
  return [];
}

async function getRecentWorkoutLogs(userId, days) {
  return [];
}

async function getRecentWeightLogs(userId, days) {
  return [];
}

async function getRecentMeasurementLogs(userId, days) {
  return [];
}

async function getRecentProgressPhotos(userId, count) {
  return [];
}
