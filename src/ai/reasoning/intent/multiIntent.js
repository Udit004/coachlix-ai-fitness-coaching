// src/ai/reasoning/intent/multiIntent.js
// Detects compound/multiple intents in a single message
// e.g., "Show me my diet and also how many calories in chicken"

import { IntentCategory } from './patterns.js';

/**
 * Detect if message contains multiple intents
 * 
 * @param {string} message 
 * @param {Array} allIntentScores - Array of {intent, confidence, score}
 * @returns {Object} - { hasMultipleIntents, primaryIntent, secondaryIntents }
 */
export function detectMultipleIntents(message, allIntentScores) {
  // Sort by confidence
  const sortedIntents = [...allIntentScores]
    .filter(i => i.confidence > 0.3) // Only consider reasonable matches
    .sort((a, b) => b.confidence - a.confidence);
  
  if (sortedIntents.length < 2) {
    return {
      hasMultipleIntents: false,
      primaryIntent: sortedIntents[0] || null,
      secondaryIntents: [],
      reasoning: 'Single intent detected'
    };
  }
  
  const primaryIntent = sortedIntents[0];
  const potentialSecondary = sortedIntents.slice(1);
  
  // Check if there are compound sentence indicators
  const hasCompoundIndicators = detectCompoundIndicators(message);
  
  // Check confidence gap - if secondary intent is close to primary, it might be multi-intent
  const confidenceGap = primaryIntent.confidence - potentialSecondary[0].confidence;
  
  // Multi-intent if:
  // 1. Has compound indicators (and, also, etc.)
  // 2. Secondary intent confidence is reasonably high (> 0.5)
  // 3. Confidence gap is small (< 0.3)
  const hasMultipleIntents = 
    hasCompoundIndicators && 
    potentialSecondary[0].confidence > 0.5 && 
    confidenceGap < 0.3;
  
  const secondaryIntents = hasMultipleIntents 
    ? potentialSecondary.filter(i => i.confidence > 0.5)
    : [];
  
  return {
    hasMultipleIntents,
    primaryIntent,
    secondaryIntents,
    reasoning: hasMultipleIntents 
      ? `Compound sentence with ${secondaryIntents.length + 1} intents`
      : 'Single dominant intent'
  };
}

/**
 * Detect compound sentence indicators
 * 
 * @param {string} message 
 * @returns {boolean}
 */
function detectCompoundIndicators(message) {
  const compoundPatterns = [
    /\b(and|also|plus|additionally|furthermore)\b/i,
    /\b(but|however|though|although)\b/i,
    /,.*\b(and|also|or)\b/i, // Comma followed by conjunction
    /[.!?].*[.!?]/, // Multiple sentences
    /\band\s+(also|too)\b/i
  ];
  
  return compoundPatterns.some(pattern => pattern.test(message));
}

/**
 * Split message into sub-messages for multi-intent handling
 * 
 * @param {string} message 
 * @returns {Array<string>}
 */
export function splitCompoundMessage(message) {
  // Split on common delimiters
  const parts = [];
  
  // Try splitting on sentence boundaries
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length > 1) {
    return sentences.map(s => s.trim());
  }
  
  // Try splitting on "and also", "and", etc.
  const andSplit = message.split(/\b(and also|and then|also|plus)\b/i);
  
  if (andSplit.length > 1) {
    // Filter out the conjunctions themselves
    return andSplit
      .filter(part => !/^(and also|and then|also|plus)$/i.test(part.trim()))
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  
  // Can't split - return original
  return [message];
}

/**
 * Determine how to handle multiple intents
 * 
 * @param {Object} multiIntentResult 
 * @returns {Object} - { strategy, intentsToHandle }
 */
export function getMultiIntentStrategy(multiIntentResult) {
  if (!multiIntentResult.hasMultipleIntents) {
    return {
      strategy: 'single',
      intentsToHandle: [multiIntentResult.primaryIntent],
      reasoning: 'Single intent - handle normally'
    };
  }
  
  const { primaryIntent, secondaryIntents } = multiIntentResult;
  
  // Check if intents are compatible (can be handled together)
  const areCompatible = checkIntentCompatibility(
    primaryIntent.intent,
    secondaryIntents.map(i => i.intent)
  );
  
  if (areCompatible) {
    return {
      strategy: 'combined',
      intentsToHandle: [primaryIntent, ...secondaryIntents],
      reasoning: 'Compatible intents - handle together in single response'
    };
  } else {
    return {
      strategy: 'sequential',
      intentsToHandle: [primaryIntent, ...secondaryIntents],
      reasoning: 'Incompatible intents - address primary, acknowledge secondary'
    };
  }
}

/**
 * Check if multiple intents can be handled together
 * 
 * @param {string} primaryIntent 
 * @param {Array<string>} secondaryIntents 
 * @returns {boolean}
 */
function checkIntentCompatibility(primaryIntent, secondaryIntents) {
  // Define compatible intent groups
  const compatibleGroups = [
    // Nutrition-related
    [
      IntentCategory.NUTRITION_INQUIRY,
      IntentCategory.RECIPE_REQUEST,
      IntentCategory.FOOD_COMPARISON,
      IntentCategory.QUESTION_SPECIFIC
    ],
    
    // Workout-related
    [
      IntentCategory.WORKOUT_INQUIRY,
      IntentCategory.EXERCISE_TECHNIQUE,
      IntentCategory.QUESTION_SPECIFIC
    ],
    
    // Plan-related
    [
      IntentCategory.PLAN_REQUEST,
      IntentCategory.PLAN_MODIFICATION,
      IntentCategory.QUESTION_SPECIFIC
    ],
    
    // Information-seeking
    [
      IntentCategory.QUESTION_GENERAL,
      IntentCategory.QUESTION_SPECIFIC,
      IntentCategory.NUTRITION_INQUIRY,
      IntentCategory.WORKOUT_INQUIRY
    ]
  ];
  
  // Check if all intents belong to the same group
  for (const group of compatibleGroups) {
    const primaryInGroup = group.includes(primaryIntent);
    const allSecondaryInGroup = secondaryIntents.every(intent => group.includes(intent));
    
    if (primaryInGroup && allSecondaryInGroup) {
      return true;
    }
  }
  
  return false;
}

/**
 * Merge data requirements from multiple intents
 * 
 * @param {Array} intents - Array of intent objects with dataNeeds
 * @param {string} message - User message for context
 * @returns {Object} - Merged data requirements
 */
export function mergeDataRequirements(intents, message = '') {
  const merged = {
    needsProfile: false,
    needsDiet: false,
    needsWorkout: false,
    needsHistory: false,
    needsVectorSearch: false,
    priority: 'low'
  };
  
  const priorities = ['low', 'medium', 'high'];
  let highestPriority = 'low';
  
  const messageLower = message.toLowerCase();
  
  for (const intentObj of intents) {
    // Get the intent name
    const intentName = typeof intentObj === 'string' ? intentObj : intentObj.intent;
    
    // Calculate data needs for this intent
    const dataNeeds = calculateDataNeedsForIntent(intentName, messageLower);
    
    // OR all the needs
    merged.needsProfile = merged.needsProfile || dataNeeds.needsProfile;
    merged.needsDiet = merged.needsDiet || dataNeeds.needsDiet;
    merged.needsWorkout = merged.needsWorkout || dataNeeds.needsWorkout;
    merged.needsHistory = merged.needsHistory || dataNeeds.needsHistory;
    merged.needsVectorSearch = merged.needsVectorSearch || dataNeeds.needsVectorSearch;
    
    // Take highest priority
    const currentPriority = dataNeeds.priority || 'low';
    if (priorities.indexOf(currentPriority) > priorities.indexOf(highestPriority)) {
      highestPriority = currentPriority;
    }
  }
  
  merged.priority = highestPriority;
  
  return merged;
}

/**
 * Calculate data needs for a single intent
 * Helper function for mergeDataRequirements
 */
function calculateDataNeedsForIntent(intent, messageLower) {
  const needs = {
    needsProfile: true,
    needsDiet: false,
    needsWorkout: false,
    needsHistory: false,
    needsVectorSearch: false,
    priority: 'low'
  };
  
  // Import IntentCategory from patterns
  const IntentCategory = {
    GREETING: 'greeting',
    NUTRITION_INQUIRY: 'nutrition_inquiry',
    FOOD_COMPARISON: 'food_comparison',
    WORKOUT_INQUIRY: 'workout_inquiry',
    QUESTION_SPECIFIC: 'question_specific',
    PLAN_REQUEST: 'plan_request',
    PLAN_MODIFICATION: 'plan_modification'
  };
  
  switch (intent) {
    case IntentCategory.GREETING:
      needs.needsProfile = false;
      needs.priority = 'low';
      break;
      
    case IntentCategory.NUTRITION_INQUIRY:
    case IntentCategory.FOOD_COMPARISON:
      needs.needsProfile = true;
      needs.needsDiet = false;
      needs.needsWorkout = false;
      needs.needsHistory = false;
      needs.priority = 'low';
      break;
      
    case IntentCategory.WORKOUT_INQUIRY:
      needs.needsWorkout = true;
      needs.needsHistory = true;
      needs.priority = 'high';
      break;
      
    case IntentCategory.QUESTION_SPECIFIC:
      needs.needsDiet = messageLower.includes('diet') || messageLower.includes('meal');
      needs.needsWorkout = messageLower.includes('workout') || messageLower.includes('exercise');
      needs.needsHistory = true;
      needs.priority = 'high';
      break;
      
    case IntentCategory.PLAN_REQUEST:
    case IntentCategory.PLAN_MODIFICATION:
      needs.needsDiet = messageLower.includes('diet') || messageLower.includes('meal');
      needs.needsWorkout = messageLower.includes('workout') || messageLower.includes('exercise');
      needs.needsHistory = true;
      needs.priority = 'high';
      break;
      
    default:
      needs.priority = 'low';
  }
  
  return needs;
}

/**
 * Get summary of multi-intent detection for logging
 * 
 * @param {Object} multiIntentResult 
 * @returns {string}
 */
export function getMultiIntentSummary(multiIntentResult) {
  if (!multiIntentResult.hasMultipleIntents) {
    return `Single intent: ${multiIntentResult.primaryIntent?.intent || 'unknown'}`;
  }
  
  const primary = multiIntentResult.primaryIntent.intent;
  const secondary = multiIntentResult.secondaryIntents
    .map(i => i.intent)
    .join(', ');
  
  return `Multi-intent: ${primary} + [${secondary}]`;
}
