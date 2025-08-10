// lib/contextRetrieval.js - Enhanced Context Retrieval for Fitness Chatbot
import { connectDB } from "./db";
import User from "../models/userProfileModel";
import DietPlan from "../models/DietPlan";
import WorkoutPlan from "../models/WorkoutPlan";
import FitnessEmbedding from "../models/FitnessEmbedding";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize embeddings for semantic search
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

/**
 * Main function to retrieve all relevant context for user query
 * @param {string} userId - Firebase UID
 * @param {string} userQuery - User's message/question
 * @param {number} maxLength - Maximum context length
 * @returns {Object} Combined context from all sources
 */
export async function getRelevantContext(userId, userQuery, maxLength = 2000) {
  try {
    await connectDB();
    
    // Get context from all three sources in parallel
    const [profileContext, dietContext, workoutContext] = await Promise.all([
      getUserProfileContext(userId, userQuery),
      getDietPlanContext(userId, userQuery),
      getWorkoutPlanContext(userId, userQuery)
    ]);

    // Combine contexts with length management
    const combinedContext = combineContexts({
      profile: profileContext,
      diet: dietContext,
      workout: workoutContext
    }, maxLength);

    return combinedContext;
    
  } catch (error) {
    console.error("Error retrieving context:", error);
    return {
      profile: "Error loading profile context",
      diet: "Error loading diet context", 
      workout: "Error loading workout context",
      combined: "Error loading user context"
    };
  }
}

/**
 * Get relevant user profile context
 * @param {string} userId - Firebase UID
 * @param {string} query - User query for relevance matching
 * @returns {string} Formatted profile context
 */
async function getUserProfileContext(userId, query) {
  try {
    const user = await User.findOne({ firebaseUid: userId }).lean();
    
    if (!user) {
      return "No user profile found";
    }

    // Extract relevant profile information based on query
    const queryLower = query.toLowerCase();
    let context = `User Profile - ${user.name || 'User'}:\n`;
    
    // Always include basic info
    if (user.age || user.birthDate) {
      const age = user.age || calculateAge(user.birthDate);
      context += `• Age: ${age}\n`;
    }
    if (user.height) context += `• Height: ${user.height}\n`;
    if (user.weight) context += `• Current Weight: ${user.weight}\n`;
    if (user.targetWeight) context += `• Target Weight: ${user.targetWeight}\n`;
    if (user.fitnessGoal) context += `• Primary Goal: ${user.fitnessGoal}\n`;
    if (user.experience) context += `• Experience Level: ${user.experience}\n`;

    // Query-specific context
    if (queryLower.includes('goal') || queryLower.includes('target')) {
      if (user.fitnessGoal) context += `• Fitness Goal: ${user.fitnessGoal}\n`;
      if (user.targetWeight) context += `• Weight Target: ${user.targetWeight}\n`;
    }

    if (queryLower.includes('achievement') || queryLower.includes('progress') || queryLower.includes('stats')) {
      if (user.stats) {
        context += `• Workouts Completed: ${user.stats.workoutsCompleted || 0}\n`;
        context += `• Current Streak: ${user.stats.daysStreak || 0} days\n`;
        context += `• Total Calories Burned: ${user.stats.caloriesBurned || 0}\n`;
      }
      
      // Include recent achievements
      if (user.achievements && user.achievements.length > 0) {
        const recentAchievements = user.achievements
          .filter(a => a.earned)
          .slice(-3)
          .map(a => a.title)
          .join(', ');
        if (recentAchievements) {
          context += `• Recent Achievements: ${recentAchievements}\n`;
        }
      }
    }

    if (queryLower.includes('activity') || queryLower.includes('recent')) {
      if (user.recentActivities && user.recentActivities.length > 0) {
        const recentActivity = user.recentActivities.slice(0, 3);
        context += `• Recent Activities:\n`;
        recentActivity.forEach(activity => {
          context += `  - ${activity.title} (${activity.type})\n`;
        });
      }
    }

    if (user.bio && (queryLower.includes('about') || queryLower.includes('info'))) {
      context += `• Additional Info: ${user.bio}\n`;
    }

    return context;
    
  } catch (error) {
    console.error("Error getting user profile context:", error);
    return "Error loading user profile";
  }
}

/**
 * Get relevant diet plan context
 * @param {string} userId - Firebase UID
 * @param {string} query - User query for relevance matching
 * @returns {string} Formatted diet context
 */
async function getDietPlanContext(userId, query) {
  try {
    const dietPlans = await DietPlan.find({ 
      userId, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(3) // Get recent active plans
    .lean();

    if (!dietPlans || dietPlans.length === 0) {
      return "No active diet plans found";
    }

    const queryLower = query.toLowerCase();
    let context = "Diet Plans:\n";

    for (const plan of dietPlans) {
      context += `\n${plan.name} (${plan.goal}):\n`;
      context += `• Target: ${plan.targetCalories} calories, ${plan.targetProtein}g protein\n`;
      
      // Query-specific diet information
      if (queryLower.includes('meal') || queryLower.includes('food') || queryLower.includes('eat')) {
        // Get recent meals from the plan
        if (plan.days && plan.days.length > 0) {
          const recentDay = plan.days[0];
          if (recentDay.meals && recentDay.meals.length > 0) {
            context += `• Recent Meals:\n`;
            recentDay.meals.slice(0, 2).forEach(meal => {
              context += `  - ${meal.type}: ${meal.totalCalories} cal, ${meal.totalProtein}g protein\n`;
            });
          }
        }
      }

      if (queryLower.includes('calorie') || queryLower.includes('macro')) {
        context += `• Macros: ${plan.targetProtein}g protein, ${plan.targetCarbs}g carbs, ${plan.targetFats}g fats\n`;
      }

      if (queryLower.includes('progress') || queryLower.includes('average')) {
        const avgCalories = plan.getAverageCalories ? plan.getAverageCalories() : 'N/A';
        context += `• Average Daily Calories: ${avgCalories}\n`;
      }
    }

    return context;
    
  } catch (error) {
    console.error("Error getting diet plan context:", error);
    return "Error loading diet plan context";
  }
}

/**
 * Get relevant workout plan context
 * @param {string} userId - Firebase UID  
 * @param {string} query - User query for relevance matching
 * @returns {string} Formatted workout context
 */
async function getWorkoutPlanContext(userId, query) {
  try {
    const workoutPlans = await WorkoutPlan.find({ 
      userId, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(3) // Get recent active plans
    .lean();

    if (!workoutPlans || workoutPlans.length === 0) {
      return "No active workout plans found";
    }

    const queryLower = query.toLowerCase();
    let context = "Workout Plans:\n";

    for (const plan of workoutPlans) {
      context += `\n${plan.name} (${plan.goal}):\n`;
      context += `• Difficulty: ${plan.difficulty}, Frequency: ${plan.workoutFrequency}x/week\n`;
      context += `• Duration: ${plan.duration} weeks, Current Week: ${plan.currentWeek}\n`;
      
      // Query-specific workout information
      if (queryLower.includes('exercise') || queryLower.includes('workout') || queryLower.includes('train')) {
        // Get current week's workouts
        const currentWeek = plan.weeks?.find(w => w.weekNumber === plan.currentWeek);
        if (currentWeek && currentWeek.days) {
          const upcomingWorkouts = currentWeek.days
            .filter(day => !day.isRestDay && day.workouts.length > 0)
            .slice(0, 2);
          
          if (upcomingWorkouts.length > 0) {
            context += `• Upcoming Workouts:\n`;
            upcomingWorkouts.forEach(day => {
              day.workouts.forEach(workout => {
                context += `  - ${workout.name} (${workout.type}, ${workout.estimatedDuration}min)\n`;
              });
            });
          }
        }
      }

      if (queryLower.includes('progress') || queryLower.includes('stats') || queryLower.includes('completion')) {
        if (plan.stats) {
          context += `• Progress: ${plan.stats.totalWorkouts} workouts completed\n`;
          context += `• Completion Rate: ${plan.stats.completionRate}%\n`;
          context += `• Average Duration: ${plan.stats.averageWorkoutDuration} min\n`;
        }
      }

      if (queryLower.includes('muscle') || queryLower.includes('target')) {
        if (plan.targetMuscleGroups && plan.targetMuscleGroups.length > 0) {
          context += `• Target Muscles: ${plan.targetMuscleGroups.join(', ')}\n`;
        }
      }

      if (queryLower.includes('equipment')) {
        if (plan.equipment && plan.equipment.length > 0) {
          context += `• Equipment: ${plan.equipment.join(', ')}\n`;
        }
      }
    }

    return context;
    
  } catch (error) {
    console.error("Error getting workout plan context:", error);
    return "Error loading workout plan context";
  }
}

/**
 * Combine contexts from all sources with length management
 * @param {Object} contexts - Object containing profile, diet, workout contexts
 * @param {number} maxLength - Maximum total context length
 * @returns {Object} Combined and formatted context
 */
function combineContexts(contexts, maxLength = 2000) {
  const { profile, diet, workout } = contexts;
  
  // Prioritize contexts based on content quality and relevance
  const prioritizedContexts = [
    { name: 'profile', content: profile, priority: 1 },
    { name: 'workout', content: workout, priority: 2 },
    { name: 'diet', content: diet, priority: 3 }
  ].filter(ctx => ctx.content && ctx.content.length > 20); // Filter out empty/error contexts

  let combinedContext = "\n=== USER CONTEXT ===\n";
  let remainingLength = maxLength - combinedContext.length;

  // Add contexts in priority order
  for (const ctx of prioritizedContexts) {
    const sectionHeader = `\n[${ctx.name.toUpperCase()}]\n`;
    const totalSectionLength = sectionHeader.length + ctx.content.length + 1;
    
    if (remainingLength >= totalSectionLength) {
      combinedContext += sectionHeader + ctx.content + "\n";
      remainingLength -= totalSectionLength;
    } else if (remainingLength > sectionHeader.length + 100) {
      // Truncate content if we have some space left
      const availableSpace = remainingLength - sectionHeader.length - 20;
      const truncatedContent = ctx.content.substring(0, availableSpace) + "...";
      combinedContext += sectionHeader + truncatedContent + "\n";
      break;
    } else {
      break; // No more space
    }
  }

  combinedContext += "=== END CONTEXT ===\n";

  return {
    profile: profile,
    diet: diet,
    workout: workout,
    combined: combinedContext,
    totalLength: combinedContext.length
  };
}

/**
 * Enhanced semantic search across user's personal data
 * @param {string} userId - Firebase UID
 * @param {string} query - User query
 * @param {number} limit - Number of results per source
 * @returns {Object} Semantic search results
 */
export async function semanticSearchUserData(userId, query, limit = 2) {
  try {
    const queryEmbedding = await embeddings.embedQuery(query);
    
    // Search across different data types
    const [dietResults, workoutResults] = await Promise.all([
      searchDietPlansSemanticaly(userId, query, queryEmbedding, limit),
      searchWorkoutPlansSemanticaly(userId, query, queryEmbedding, limit)
    ]);

    return {
      diet: dietResults,
      workout: workoutResults
    };
    
  } catch (error) {
    console.error("Error in semantic search:", error);
    return { diet: [], workout: [] };
  }
}

/**
 * Semantic search in user's diet plans
 */
async function searchDietPlansSemanticaly(userId, query, queryEmbedding, limit) {
  try {
    const dietPlans = await DietPlan.find({ userId, isActive: true }).lean();
    const results = [];

    for (const plan of dietPlans) {
      // Create searchable content from diet plan
      const searchableContent = createDietSearchContent(plan);
      
      // Calculate similarity (simplified - you might want to use vector similarity)
      const relevanceScore = calculateTextRelevance(query, searchableContent);
      
      if (relevanceScore > 0.1) { // Threshold for relevance
        results.push({
          content: searchableContent,
          metadata: {
            type: 'diet',
            planName: plan.name,
            goal: plan.goal,
            calories: plan.targetCalories
          },
          score: relevanceScore
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
    
  } catch (error) {
    console.error("Error in diet semantic search:", error);
    return [];
  }
}

/**
 * Semantic search in user's workout plans
 */
async function searchWorkoutPlansSemanticaly(userId, query, queryEmbedding, limit) {
  try {
    const workoutPlans = await WorkoutPlan.find({ userId, isActive: true }).lean();
    const results = [];

    for (const plan of workoutPlans) {
      // Create searchable content from workout plan
      const searchableContent = createWorkoutSearchContent(plan);
      
      // Calculate similarity
      const relevanceScore = calculateTextRelevance(query, searchableContent);
      
      if (relevanceScore > 0.1) {
        results.push({
          content: searchableContent,
          metadata: {
            type: 'workout',
            planName: plan.name,
            goal: plan.goal,
            difficulty: plan.difficulty
          },
          score: relevanceScore
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
    
  } catch (error) {
    console.error("Error in workout semantic search:", error);
    return [];
  }
}

/**
 * Create searchable content from diet plan
 */
function createDietSearchContent(dietPlan) {
  let content = `Diet Plan: ${dietPlan.name}. Goal: ${dietPlan.goal}. `;
  content += `Target: ${dietPlan.targetCalories} calories, ${dietPlan.targetProtein}g protein. `;
  
  if (dietPlan.days && dietPlan.days.length > 0) {
    const recentDay = dietPlan.days[0];
    if (recentDay.meals) {
      content += "Meals include: ";
      recentDay.meals.forEach(meal => {
        content += `${meal.type}: `;
        if (meal.items && meal.items.length > 0) {
          const foodNames = meal.items.map(item => item.name).join(', ');
          content += `${foodNames}. `;
        }
      });
    }
  }
  
  return content;
}

/**
 * Create searchable content from workout plan
 */
function createWorkoutSearchContent(workoutPlan) {
  let content = `Workout Plan: ${workoutPlan.name}. Goal: ${workoutPlan.goal}. `;
  content += `Difficulty: ${workoutPlan.difficulty}. Frequency: ${workoutPlan.workoutFrequency}x per week. `;
  
  if (workoutPlan.targetMuscleGroups) {
    content += `Target muscles: ${workoutPlan.targetMuscleGroups.join(', ')}. `;
  }
  
  if (workoutPlan.equipment) {
    content += `Equipment: ${workoutPlan.equipment.join(', ')}. `;
  }
  
  // Add current week workout details
  if (workoutPlan.weeks && workoutPlan.weeks.length > 0) {
    const currentWeek = workoutPlan.weeks.find(w => w.weekNumber === workoutPlan.currentWeek) || workoutPlan.weeks[0];
    if (currentWeek && currentWeek.days) {
      content += "Current workouts: ";
      currentWeek.days.forEach(day => {
        if (!day.isRestDay && day.workouts) {
          day.workouts.forEach(workout => {
            content += `${workout.name} (${workout.type}). `;
            if (workout.exercises && workout.exercises.length > 0) {
              const exerciseNames = workout.exercises.map(ex => ex.name).slice(0, 3).join(', ');
              content += `Exercises: ${exerciseNames}. `;
            }
          });
        }
      });
    }
  }
  
  return content;
}

/**
 * Simple text relevance calculation (can be enhanced with proper vector similarity)
 */
function calculateTextRelevance(query, content) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  
  let matches = 0;
  let weightedScore = 0;
  
  queryWords.forEach(word => {
    if (word.length > 2) { // Skip very short words
      const wordCount = (contentLower.match(new RegExp(word, 'g')) || []).length;
      matches += wordCount;
      
      // Weight longer words more heavily
      weightedScore += wordCount * (word.length / 10);
    }
  });
  
  // Normalize by content length
  return weightedScore / Math.max(content.length / 100, 1);
}

/**
 * Calculate age from birth date
 */
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

/**
 * Format context for LLM prompt injection
 * @param {Object} contextData - Combined context data
 * @returns {string} Formatted context for system prompt
 */
export function formatContextForPrompt(contextData) {
  if (!contextData || !contextData.combined) {
    return "";
  }
  
  return `\n\n=== PERSONALIZED USER CONTEXT ===
${contextData.combined}

IMPORTANT INSTRUCTIONS:
- Use this context to provide personalized advice
- Reference the user's current plans, goals, and progress when relevant
- If the context shows specific diet/workout plans, refer to them specifically
- If context is limited, ask clarifying questions to better help the user
- Always consider the user's experience level and current goals
=== END PERSONALIZED CONTEXT ===\n`;
}