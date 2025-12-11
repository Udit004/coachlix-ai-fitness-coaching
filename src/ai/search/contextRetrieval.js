// src/ai/search/contextRetrieval.js - Minimal User Data Retrieval with Caching
// OPTIMIZED for 1-2 LLM call architecture
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";
import DietPlan from "../../models/DietPlan";
import WorkoutPlan from "../../models/WorkoutPlan";
import { getCachedProfile, getCachedDietPlan, getCachedWorkoutPlan } from "../config/cache.js";

/**
 * OPTIMIZED: Build minimal context for new architecture
 * Only loads essential data to minimize tokens
 * Perfect for 1-2 LLM call architecture
 * 
 * @param {string} userId - User ID
 * @param {string} message - User message (for query hints)
 * @param {Object} intent - Intent classification with dataNeeds (optional)
 * @returns {Promise<Object>} Minimal context object
 */
export async function buildMinimalContext(userId, message = '', intent = null) {
  try {
    await connectDB();
    
    console.log('[MinimalContext] Building context for userId:', userId);
    
    // Load only essential user profile data (cached)
    const profileData = await getBasicUserProfile(userId);
    const profile = typeof profileData === 'string' ? profileData : profileData.text;
    const rawProfile = typeof profileData === 'object' ? profileData.rawProfile : null;
    
    // SMART FETCHING: Use intent.dataNeeds if available, fallback to message keywords
    let needsDiet = false;
    let needsWorkout = false;
    
    if (intent && intent.dataNeeds) {
      // Use precise intent-based data needs (PREFERRED)
      needsDiet = intent.dataNeeds.needsDiet;
      needsWorkout = intent.dataNeeds.needsWorkout;
      console.log('[MinimalContext] Using intent.dataNeeds:', { needsDiet, needsWorkout });
    } else {
      // Fallback to message keyword detection
      needsDiet = /\b(diet|food|meal|eat|calorie|nutrition|macro)\b/i.test(message);
      needsWorkout = /\b(workout|exercise|train|gym|fitness|muscle|strength)\b/i.test(message);
      console.log('[MinimalContext] Using keyword detection:', { needsDiet, needsWorkout });
    }
    
    let dietSummary = null;
    let workoutSummary = null;
    
    // Load only if needed (lazy loading)
    if (needsDiet) {
      dietSummary = await getDietPlanSummary(userId);
      console.log('[MinimalContext] ✅ Diet plan loaded');
    } else {
      console.log('[MinimalContext] ⚡ Diet plan SKIPPED (not needed)');
    }
    
    if (needsWorkout) {
      workoutSummary = await getWorkoutPlanSummary(userId);
      console.log('[MinimalContext] ✅ Workout plan loaded');
    } else {
      console.log('[MinimalContext] ⚡ Workout plan SKIPPED (not needed)');
    }
    
    // Build combined context (keep it minimal - max 600 tokens ~2400 chars)
    let combined = `=== USER PROFILE ===\n`;
    combined += profile;
    
    if (dietSummary) {
      combined += `\n\n=== CURRENT DIET PLAN ===\n${dietSummary}`;
    }
    
    if (workoutSummary) {
      combined += `\n\n=== CURRENT WORKOUT PLAN ===\n${workoutSummary}`;
    }
    
    // Truncate if too long (safety check)
    if (combined.length > 2400) {
      combined = combined.substring(0, 2400) + '...\n[Context truncated for efficiency]';
    }
    
    console.log('[MinimalContext] Context built:', {
      totalLength: combined.length,
      hasDiet: !!dietSummary,
      hasWorkout: !!workoutSummary
    });
    
    return {
      profile: rawProfile, // Return raw profile object for access to fields
      profileText: profile, // Keep text version for display
      diet: dietSummary,
      workout: workoutSummary,
      combined,
      totalLength: combined.length
    };
    
  } catch (error) {
    console.error('[MinimalContext] Error:', error);
    return {
      profile: null,
      profileText: 'Error loading profile',
      diet: null,
      workout: null,
      combined: 'User context unavailable',
      totalLength: 0
    };
  }
}

/**
 * Get basic user profile (minimal, essential info only)
 * Cached for 5 minutes
 */
async function getBasicUserProfile(userId) {
  return getCachedProfile(userId, async () => {
    try {
      const user = await User.findOne({ firebaseUid: userId })
        .select('name age gender height weight targetWeight fitnessGoal experience dietaryPreference allergies location')
        .lean();
      
      if (!user) return { text: 'No profile found', rawProfile: null };
      
      let profile = `Name: ${user.name || 'User'}\n`;
      
      if (user.age) profile += `Age: ${user.age} years\n`;
      if (user.gender) profile += `Gender: ${user.gender}\n`;
      if (user.height) profile += `Height: ${user.height}\n`;
      if (user.weight) profile += `Weight: ${user.weight}\n`;
      if (user.targetWeight) profile += `Target: ${user.targetWeight}\n`;
      if (user.fitnessGoal) profile += `Goal: ${user.fitnessGoal}\n`;
      if (user.experience) profile += `Experience: ${user.experience}\n`;
      if (user.dietaryPreference) profile += `Diet Preference: ${user.dietaryPreference}\n`;
      if (user.allergies && user.allergies.length > 0) {
        profile += `Allergies: ${user.allergies.join(', ')}\n`;
      }
      
      // Return both formatted text and raw user object
      return { text: profile, rawProfile: user };
      
    } catch (error) {
      console.error('[BasicProfile] Error:', error);
      return { text: 'Error loading profile', rawProfile: null };
    }
  });
}

/**
 * Get diet plan summary (not full details, just overview)
 * Cached for 24 hours
 */
async function getDietPlanSummary(userId) {
  return getCachedDietPlan(userId, async () => {
    try {
      const plan = await DietPlan.findOne({ userId, isActive: true })
        .select('name goal duration currentDay targetCalories targetProtein targetCarbs targetFats')
        .lean();
      
      if (!plan) return null;
      
      let summary = `Plan: "${plan.name}"\n`;
      summary += `Goal: ${plan.goal}\n`;
      summary += `Day: ${plan.currentDay || 1}/${plan.duration}\n`;
      summary += `Targets: ${plan.targetCalories} kcal, ${plan.targetProtein}g protein, ${plan.targetCarbs}g carbs, ${plan.targetFats}g fats\n`;
      
      return summary;
      
    } catch (error) {
      console.error('[DietSummary] Error:', error);
      return null;
    }
  });
}

/**
 * Get workout plan summary (not full details, just overview)
 * Cached for 24 hours
 */
async function getWorkoutPlanSummary(userId) {
  return getCachedWorkoutPlan(userId, async () => {
    try {
      const plan = await WorkoutPlan.findOne({ userId, isActive: true })
        .select('name goal difficulty duration currentWeek workoutFrequency targetMuscleGroups')
        .lean();
      
      if (!plan) return null;
      
      let summary = `Plan: "${plan.name}"\n`;
      summary += `Goal: ${plan.goal}\n`;
      summary += `Difficulty: ${plan.difficulty}\n`;
      summary += `Week: ${plan.currentWeek || 1}/${plan.duration}\n`;
      summary += `Frequency: ${plan.workoutFrequency}x per week\n`;
      if (plan.targetMuscleGroups && plan.targetMuscleGroups.length > 0) {
        summary += `Focus: ${plan.targetMuscleGroups.join(', ')}\n`;
      }
      
      return summary;
      
    } catch (error) {
      console.error('[WorkoutSummary] Error:', error);
      return null;
    }
  });
}
