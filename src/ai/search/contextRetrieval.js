// src/ai/search/contextRetrieval.js - Minimal User Data Retrieval with Caching
// OPTIMIZED for 1-2 LLM call architecture
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";
import DietPlan from "../../models/DietPlan";
import WorkoutPlan from "../../models/WorkoutPlan";
import { getCachedProfile, getCachedDietPlan, getCachedWorkoutPlan } from "../config/cache.js";

/**
 * Fetch full plan data needed for plan_modification intent.
 * Returns planId, plan name, target macros, and the specific day's meals
 * so the LLM can call update_diet_plan directly without a fetch_details round-trip.
 *
 * @param {string} userId
 * @param {number} dayNumber - 1-based day index extracted from intent.entities
 * @returns {Promise<Object|null>}
 */
export async function getDietPlanForModification(userId, dayNumber = 1) {
  try {
    const plan = await DietPlan.findOne({ userId, isActive: true })
      .select('_id name goal targetCalories targetProtein targetCarbs targetFats days')
      .lean();

    if (!plan) return null;

    // Only send the one day the user mentioned — keeps payload small
    const dayIndex = dayNumber - 1;
    const day = plan.days?.[dayIndex] ?? plan.days?.[0] ?? null;

    // Format the current meals for that day into a compact text block
    let currentMealsText = '';
    if (day?.meals?.length > 0) {
      day.meals.forEach(meal => {
        const itemsText = meal.items?.map(i =>
          `    • ${i.name} — ${i.calories ?? 0} kcal | P:${i.protein ?? 0}g C:${i.carbs ?? 0}g F:${i.fats ?? 0}g${i.quantity ? ` (${i.quantity})` : ''}`
        ).join('\n') ?? '    (no items)';
        currentMealsText += `  ${meal.type}:\n${itemsText}\n`;
      });
    } else {
      currentMealsText = '  (no meals set for this day yet)';
    }

    return {
      planId: String(plan._id),
      planName: plan.name,
      goal: plan.goal,
      targetCalories: plan.targetCalories,
      targetProtein: plan.targetProtein,
      targetCarbs: plan.targetCarbs,
      targetFats: plan.targetFats,
      dayNumber: day?.dayNumber ?? dayNumber,
      currentMealsText,
    };
  } catch (error) {
    console.error('[DietPlanForModification] Error:', error);
    return null;
  }
}

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

    // ── plan_modification fast path ──────────────────────────────────────────
    // Fetch full plan data (planId + specific day meals) in one query so the
    // LLM can call update_diet_plan directly — no fetch_details round-trip needed.
    if (intent?.intent === 'plan_modification') {
      // Pick day number from extracted entities (V2 extractor puts numbers in entities.numbers)
      const dayNumber = intent.entities?.numbers?.[0] ?? 1;

      const [profileData, modificationData, workoutSummary] = await Promise.all([
        getBasicUserProfile(userId),
        getDietPlanForModification(userId, dayNumber),
        intent.dataNeeds?.needsWorkout ? getWorkoutPlanSummary(userId) : Promise.resolve(null),
      ]);

      const profile = typeof profileData === 'string' ? profileData : profileData.text;
      const rawProfile = typeof profileData === 'object' ? profileData.rawProfile : null;

      let combined = `=== USER PROFILE ===\n${profile}`;

      if (modificationData) {
        combined += `\n\n=== DIET PLAN FOR MODIFICATION ===\n`;
        combined += `Plan ID: ${modificationData.planId}\n`;
        combined += `Plan Name: ${modificationData.planName}\n`;
        combined += `Goal: ${modificationData.goal}\n`;
        combined += `Daily Targets: ${modificationData.targetCalories} kcal | P:${modificationData.targetProtein}g C:${modificationData.targetCarbs}g F:${modificationData.targetFats}g\n`;
        combined += `\nCurrent Day ${modificationData.dayNumber} meals:\n${modificationData.currentMealsText}`;
      }

      if (workoutSummary) {
        combined += `\n\n=== CURRENT WORKOUT PLAN ===\n${workoutSummary}`;
      }

      if (combined.length > 3000) {
        combined = combined.substring(0, 3000) + '...\n[Context truncated]';
      }

      console.log('[MinimalContext] ✅ plan_modification context built (planId preloaded)', {
        hasPlanId: !!modificationData?.planId,
        dayNumber,
        totalLength: combined.length,
      });

      return {
        profile: rawProfile,
        profileText: profile,
        diet: modificationData ? `Plan: "${modificationData.planName}"` : null,
        workout: workoutSummary,
        combined,
        totalLength: combined.length,
        // Carry structured data forward so retrieveContextNode can attach it to state
        _modificationData: modificationData,
      };
    }

    // ── Default path (all other intents) ────────────────────────────────────
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
      profile: rawProfile,
      profileText: profile,
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
