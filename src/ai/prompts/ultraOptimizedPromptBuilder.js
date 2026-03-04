// src/ai/prompts/ultraOptimizedPromptBuilder.js
// ULTRA-OPTIMIZED Prompt Builder for Gemini 2.0 Flash
// Reduces tokens by 70-90% while maintaining quality
// 
// Strategy:
// - Greeting: Username only (~10 tokens)
// - General: Basic profile (name, location, gender) (~50 tokens)
// - Personalized: Progressive data based on intent
// - Plans: RAG handles data, prompt stays minimal

import { buildDynamicSystemPrompt } from "./dynamicPromptBuilder.js";

/**
 * Ultra-minimal prompt templates optimized for Gemini 2.0 Flash
 */
const ULTRA_MINIMAL_PROMPTS = {
  
  /**
   * GREETING - Ultra minimal (10-20 tokens)
   * Only username for personalization
   */
  greeting: (userContext) => {
    const name = userContext.profile?.name || 'there';
    return `You are Coachlix AI, a friendly fitness coach. Greet ${name} warmly.`;
  },
  
  /**
   * GENERAL QUESTION - Basic profile only (50-100 tokens)
   * Name, location, gender - no diet/workout data
   */
  question_general: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const location = profile.location || '';
    const gender = profile.gender || '';
    
    let prompt = `You are Coachlix AI, a knowledgeable fitness expert. Answer clearly and concisely Using Location ${location} and Gender ${gender} for formation of response but add it in response uneccery.

User: ${name}`;
    
    if (location) prompt += `, Location: ${location}`;
    if (gender) prompt += `, Gender: ${gender}`;
    
    return prompt;
  },
  
  /**
   * NUTRITION INQUIRY - Basic profile + dietary preference (100-200 tokens)
   * RAG will provide diet plan data if needed
   */
  nutrition_inquiry: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const dietPref = profile.dietaryPreference || '';
    const location = profile.location || '';
    
    let prompt = `You are Coachlix AI, a nutrition expert. Help ${name} with their nutrition question.`;
    
    if (dietPref) prompt += `\nDietary preference: ${dietPref}`;
    if (location && isIndianUser(location)) {
      prompt += `\nSuggest Indian foods (roti, dal, rice, paneer, sabzi).`;
    }
    
    return prompt;
  },
  
  /**
   * WORKOUT INQUIRY - Basic profile + fitness level (100-200 tokens)
   * RAG will provide workout plan data if needed
   */
  workout_inquiry: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const level = profile.fitnessLevel || '';
    const goal = profile.fitnessGoal || '';
    
    let prompt = `You are Coachlix AI, a fitness trainer. Help ${name} with their workout question.`;
    
    if (level) prompt += `\nFitness level: ${level}`;
    if (goal) prompt += `\nGoal: ${goal}`;
    
    return prompt;
  },
  
  /**
   * EXERCISE TECHNIQUE - Minimal (50-100 tokens)
   * Just need to explain proper form
   */
  exercise_technique: (userContext) => {
    const name = userContext.profile?.name || 'User';
    return `You are Coachlix AI, a fitness trainer. Explain proper exercise form to ${name}. Be clear and safety-focused.`;
  },
  
  /**
   * PLAN REQUEST - Profile + goal (200-400 tokens)
   * Need more context for plan creation, but RAG handles existing plans
   */
  plan_request: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const goal = profile.fitnessGoal || '';
    const level = profile.fitnessLevel || '';
    const dietPref = profile.dietaryPreference || '';
    const location = profile.location || '';
    
    let prompt = `You are Coachlix AI, an expert fitness coach. Create a personalized plan for ${name}.

Profile:`;
    if (goal) prompt += `\n- Goal: ${goal}`;
    if (level) prompt += `\n- Fitness level: ${level}`;
    if (dietPref) prompt += `\n- Dietary preference: ${dietPref}`;
    if (location) prompt += `\n- Location: ${location}`;
    
    prompt += `\n\nProvide actionable recommendations. Ask clarifying questions if needed.`;
    
    return prompt;
  },
  
  /**
   * PLAN MODIFICATION - With tool workflow (150-250 tokens)
   * RAG provides current plan context, tools execute the change
   */
  plan_modification: (userContext) => {
    const name = userContext.profile?.name || 'User';
    const location = userContext.profile?.location || '';
    const isIndian = location && /(india|mumbai|delhi|bangalore|bengaluru|chennai|kolkata|hyderabad|pune)/i.test(location);

    let prompt = `You are Coachlix AI, a fitness coach helping ${name} modify their plan.`;

    if (isIndian) {
      prompt += `\nSuggest Indian foods (roti, dal, rice, paneer, sabzi, dahi, etc.) when relevant.`;
    }

    // ── Inject preloaded plan data (planId + current day meals) ─────────────
    // buildMinimalContext fetched this during the RAG phase so the LLM does NOT
    // need to call fetch_details — that removes one full LLM round-trip.
    const modData = userContext._modificationData;
    if (modData?.planId) {
      prompt += `\n\n=== PRELOADED PLAN DATA — use directly, do NOT call fetch_details ===`;
      prompt += `\nPlan ID: ${modData.planId}`;
      prompt += `\nPlan: "${modData.planName}" | Goal: ${modData.goal}`;
      prompt += `\nTargets: ${modData.targetCalories} kcal | P:${modData.targetProtein}g C:${modData.targetCarbs}g F:${modData.targetFats}g`;
      prompt += `\n\nCurrent Day ${modData.dayNumber} meals:\n${modData.currentMealsText}`;
    }

    // ── Inject pre-fetched USDA nutrition data ───────────────────────────────
    // retrieveContextNode ran USDA lookups in parallel with the DB query for
    // any named food items extracted from the message. If data is present the
    // LLM can skip nutrition_lookup for those items entirely.
    if (userContext.preloadedNutrition?.length > 0) {
      prompt += `\n\n=== PRELOADED NUTRITION — use directly, do NOT call nutrition_lookup for these items ===`;
      userContext.preloadedNutrition.forEach(({ food, calories, protein, carbs, fat, fiber, per }) => {
        prompt += `\n${food}: ${calories} kcal | P:${protein}g C:${carbs}g F:${fat}g Fiber:${fiber}g (${per})`;
      });
    }

    prompt += `\n\n**DIET PLAN UPDATE WORKFLOW:**`;

    if (modData?.planId) {
      // Fast path: plan data already injected above.
      // Note: fetch_details and nutrition_lookup are excluded from the tool list
      // by llmNode when planId is preloaded — instructions here are a safety belt only.
      prompt += `
1. Plan ID and current meals are provided in PRELOADED PLAN DATA above.
2. For food macros: use PRELOADED NUTRITION values if listed, otherwise use your built-in knowledge for common Indian/Asian foods (chapati ~120 kcal, dal ~150 kcal/katori, sabzi ~80 kcal, rice ~130 kcal/100g, etc.).
3. Call update_diet_plan with planId: "${modData.planId}", dayNumber, mealType, and complete food items with macros.
4. Once update_diet_plan returns success, generate the final response immediately — do NOT call any more tools.`;
    } else {
      // Fallback: plan fetch failed, use original tool-call workflow
      prompt += `
1. Call fetch_details (type: "diet", detail: "specific_day") to get the Plan ID and current meals.
2. For food macros, use your built-in knowledge for common foods OR call nutrition_lookup for unusual items.
3. Call update_diet_plan with the planId from step 1.
4. Once update_diet_plan returns success, generate the final response immediately — do NOT call any more tools.`;
    }

    prompt += `\n\n**NEVER ask the user for calorie or macro details.**`;
    prompt += `\n**NEVER call update_diet_plan without planId.**`;
    prompt += `\n**NEVER call any tool after update_diet_plan has already succeeded.**`;

    return prompt;
  },
  
  /**
   * QUESTION SPECIFIC - Basic profile (100-200 tokens)
   * RAG provides user's specific data (diet/workout)
   */
  question_specific: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const goal = profile.fitnessGoal || '';
    
    let prompt = `You are Coachlix AI, ${name}'s fitness coach. Answer their question about their plan.`;
    if (goal) prompt += ` Their goal: ${goal}.`;
    prompt += ` The plan details are provided via RAG.`;
    
    return prompt;
  },
  
  /**
   * RECIPE REQUEST - Minimal (50-100 tokens)
   * Google Search provides recipe data
   */
  recipe_request: (userContext) => {
    const name = userContext.profile?.name || 'User';
    const dietPref = userContext.profile?.dietaryPreference || '';
    
    let prompt = `You are Coachlix AI, a nutrition expert. Provide ${name} with a detailed recipe.`;
    if (dietPref) prompt += ` Respect ${dietPref} preference.`;
    prompt += ` Use Google Search for accurate recipes.`;
    
    return prompt;
  },
  
  /**
   * HEALTH METRICS - Basic profile (100-150 tokens)
   * Need basic stats for calculations
   */
  health_metrics: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const age = profile.age || '';
    const gender = profile.gender || '';
    
    let prompt = `You are Coachlix AI, a fitness expert. Calculate health metrics for ${name}.`;
    if (age) prompt += `\nAge: ${age}`;
    if (gender) prompt += `\nGender: ${gender}`;
    prompt += `\n\nProvide clear explanations with the calculations.`;
    
    return prompt;
  },
  
  /**
   * PROGRESS TRACKING - Minimal (100-150 tokens)
   * RAG provides history
   */
  progress_tracking: (userContext) => {
    const name = userContext.profile?.name || 'User';
    const goal = userContext.profile?.fitnessGoal || '';
    
    let prompt = `You are Coachlix AI, ${name}'s fitness coach. Help track their progress.`;
    if (goal) prompt += ` Goal: ${goal}.`;
    prompt += ` Progress data is provided via RAG.`;
    
    return prompt;
  },
  
  /**
   * MOTIVATION - Ultra minimal (30-50 tokens)
   * Just need to encourage
   */
  motivation: (userContext) => {
    const name = userContext.profile?.name || 'User';
    const goal = userContext.profile?.fitnessGoal || 'fitness journey';
    
    return `You are Coachlix AI, a motivational fitness coach. Encourage ${name} in their ${goal}. Be empathetic and inspiring.`;
  },
  
  /**
   * FOOD COMPARISON - Minimal (50-100 tokens)
   * Google Search provides nutrition data
   */
  food_comparison: (userContext) => {
    const name = userContext.profile?.name || 'User';
    return `You are Coachlix AI, a nutrition expert. Compare foods for ${name}. Use Google Search for accurate nutrition data. Explain clearly which is better and why.`;
  },
  
  /**
   * SUPPLEMENT INQUIRY - Minimal (50-100 tokens)
   */
  supplement_inquiry: (userContext) => {
    const name = userContext.profile?.name || 'User';
    return `You are Coachlix AI, a fitness expert. Advise ${name} on supplements. Be evidence-based and safety-focused. Recommend consulting a doctor for medical concerns.`;
  }
};

/**
 * Helper function to detect if user is from India
 */
function isIndianUser(location) {
  if (!location) return true;
  const locationLower = location.toLowerCase();
  const indianKeywords = [
    'india', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata',
    'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'kerala', 'tamil nadu', 'maharashtra'
  ];
  return indianKeywords.some(keyword => locationLower.includes(keyword));
}

/**
 * Build ultra-optimized system prompt based on intent
 * 
 * @param {Object} intent - Intent classification result from V2
 * @param {Object} userContext - User context (RAG will provide detailed data)
 * @param {string} userId - User ID
 * @returns {string} - Ultra-optimized system prompt
 */
export function buildUltraOptimizedPrompt(intent, userContext, userId) {
  const intentType = intent.intent || 'question_general';
  
  // Get the ultra-minimal prompt for this intent
  const promptBuilder = ULTRA_MINIMAL_PROMPTS[intentType] || ULTRA_MINIMAL_PROMPTS.question_general;
  let prompt = promptBuilder(userContext);
  
  // Add user ID (always needed)
  prompt += `\n\nUSER_ID: ${userId}`;
  
  // Add minimal communication guidelines (only for complex intents)
  if (shouldAddCommunicationGuidelines(intentType)) {
    prompt += `\n\n💬 Keep responses concise, friendly, and actionable. Use 1-2 emojis max.`;
  }
  
  // Estimate tokens
  const estimatedTokens = Math.ceil(prompt.length / 4);
  console.log(`[UltraOptimized] Intent: ${intentType}`);
  console.log(`[UltraOptimized] Prompt size: ~${estimatedTokens} tokens`);
  console.log(`[UltraOptimized] Token reduction: ~${calculateTokenReduction(intentType, estimatedTokens)}%`);
  
  return prompt;
}

/**
 * Determine if communication guidelines are needed
 */
function shouldAddCommunicationGuidelines(intentType) {
  const complexIntents = [
    'plan_request',
    'plan_modification',
    'nutrition_inquiry',
    'workout_inquiry'
  ];
  return complexIntents.includes(intentType);
}

/**
 * Calculate token reduction compared to old prompts
 */
function calculateTokenReduction(intentType, currentTokens) {
  const oldTokenCounts = {
    greeting: 500,
    question_general: 800,
    nutrition_inquiry: 1200,
    workout_inquiry: 1200,
    plan_request: 1500,
    plan_modification: 1500,
    question_specific: 1000,
    recipe_request: 800,
    health_metrics: 1000,
    progress_tracking: 1000,
    motivation: 600,
    food_comparison: 800,
    supplement_inquiry: 800,
    exercise_technique: 800
  };
  
  const oldTokens = oldTokenCounts[intentType] || 1000;
  const reduction = ((oldTokens - currentTokens) / oldTokens) * 100;
  return Math.round(reduction);
}

/**
 * Get prompt statistics for monitoring
 */
export function getPromptStats(intent, prompt) {
  const tokens = Math.ceil(prompt.length / 4);
  const intentType = intent.intent || 'unknown';
  
  return {
    intentType,
    promptLength: prompt.length,
    estimatedTokens: tokens,
    tokenReduction: calculateTokenReduction(intentType, tokens),
    confidence: intent.confidence,
    timestamp: new Date().toISOString()
  };
}

/**
 * Main entry point - decides between ultra-optimized and fallback
 * 
 * @param {Object} intent - Intent from V2 classifier
 * @param {Object} userContext - User context
 * @param {string} userId - User ID
 * @returns {string} - System prompt
 */
export function generateSmartPrompt(intent, userContext, userId) {
  // Use ultra-optimized for high-confidence intents
  if (intent.confidence >= 0.70 && intent.version === 'v2') {
    console.log('[SmartPrompt] Using ULTRA-OPTIMIZED prompt (70-90% token reduction)');
    return buildUltraOptimizedPrompt(intent, userContext, userId);
  }
  
  // Fallback to dynamic prompt for medium confidence
  if (intent.confidence >= 0.50) {
    console.log('[SmartPrompt] Using DYNAMIC prompt (40-60% token reduction)');
    return buildDynamicSystemPrompt(intent, userContext, userId);
  }
  
  // Fallback to dynamic prompt for low confidence (legacy full prompt removed)
  console.log('[SmartPrompt] Using DYNAMIC prompt (safety fallback)');
  return buildDynamicSystemPrompt(intent, userContext, userId);
}
