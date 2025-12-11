// src/ai/prompts/ultraOptimizedPromptBuilder.js
// ULTRA-OPTIMIZED Prompt Builder for Gemini 2.0 Flash
// Reduces tokens by 70-90% while maintaining quality
// 
// Strategy:
// - Greeting: Username only (~10 tokens)
// - General: Basic profile (name, location, gender) (~50 tokens)
// - Personalized: Progressive data based on intent
// - Plans: RAG handles data, prompt stays minimal

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
    return `You are Alex, a friendly fitness coach. Greet ${name} warmly.`;
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
    
    let prompt = `You are Alex, a knowledgeable fitness expert. Answer clearly and concisely.

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
    
    let prompt = `You are Alex, a nutrition expert. Help ${name} with their nutrition question.`;
    
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
    
    let prompt = `You are Alex, a fitness trainer. Help ${name} with their workout question.`;
    
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
    return `You are Alex, a fitness trainer. Explain proper exercise form to ${name}. Be clear and safety-focused.`;
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
    
    let prompt = `You are Alex, an expert fitness coach. Create a personalized plan for ${name}.

Profile:`;
    if (goal) prompt += `\n- Goal: ${goal}`;
    if (level) prompt += `\n- Fitness level: ${level}`;
    if (dietPref) prompt += `\n- Dietary preference: ${dietPref}`;
    if (location) prompt += `\n- Location: ${location}`;
    
    prompt += `\n\nProvide actionable recommendations. Ask clarifying questions if needed.`;
    
    return prompt;
  },
  
  /**
   * PLAN MODIFICATION - Minimal (100-200 tokens)
   * RAG provides current plan, just need to modify
   */
  plan_modification: (userContext) => {
    const name = userContext.profile?.name || 'User';
    return `You are Alex, a fitness coach. Help ${name} modify their plan. The current plan details are provided via RAG. Suggest alternatives and ask for confirmation.`;
  },
  
  /**
   * QUESTION SPECIFIC - Basic profile (100-200 tokens)
   * RAG provides user's specific data (diet/workout)
   */
  question_specific: (userContext) => {
    const profile = userContext.profile || {};
    const name = profile.name || 'User';
    const goal = profile.fitnessGoal || '';
    
    let prompt = `You are Alex, ${name}'s fitness coach. Answer their question about their plan.`;
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
    
    let prompt = `You are Alex, a nutrition expert. Provide ${name} with a detailed recipe.`;
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
    
    let prompt = `You are Alex, a fitness expert. Calculate health metrics for ${name}.`;
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
    
    let prompt = `You are Alex, ${name}'s fitness coach. Help track their progress.`;
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
    
    return `You are Alex, a motivational fitness coach. Encourage ${name} in their ${goal}. Be empathetic and inspiring.`;
  },
  
  /**
   * FOOD COMPARISON - Minimal (50-100 tokens)
   * Google Search provides nutrition data
   */
  food_comparison: (userContext) => {
    const name = userContext.profile?.name || 'User';
    return `You are Alex, a nutrition expert. Compare foods for ${name}. Use Google Search for accurate nutrition data. Explain clearly which is better and why.`;
  },
  
  /**
   * SUPPLEMENT INQUIRY - Minimal (50-100 tokens)
   */
  supplement_inquiry: (userContext) => {
    const name = userContext.profile?.name || 'User';
    return `You are Alex, a fitness expert. Advise ${name} on supplements. Be evidence-based and safety-focused. Recommend consulting a doctor for medical concerns.`;
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
    const { buildDynamicSystemPrompt } = require('./dynamicPromptBuilder');
    return buildDynamicSystemPrompt(intent, userContext, userId);
  }
  
  // Fallback to full prompt for low confidence (safety)
  console.log('[SmartPrompt] Using FULL prompt (safety fallback)');
  const { generateProfessionalSystemPrompt } = require('./systemPrompts');
  return generateProfessionalSystemPrompt(userContext, userId);
}
