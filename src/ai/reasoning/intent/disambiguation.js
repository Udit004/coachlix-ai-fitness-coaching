// src/ai/reasoning/intent/disambiguation.js
// Disambiguates unclear or ambiguous intents
// Helps when multiple intents have similar confidence scores

import { IntentCategory } from './patterns.js';

/**
 * Disambiguate between similar intents
 * 
 * @param {Array} topIntents - Top N intents with similar confidence
 * @param {string} message 
 * @param {Object} context 
 * @returns {Object} - { disambiguatedIntent, confidence, reasoning }
 */
export function disambiguateIntents(topIntents, message, context = {}) {
  if (topIntents.length === 0) {
    return null;
  }
  
  if (topIntents.length === 1) {
    return {
      disambiguatedIntent: topIntents[0].intent,
      confidence: topIntents[0].confidence,
      reasoning: 'Single clear intent'
    };
  }
  
  // Get top 2-3 intents with similar confidence
  const threshold = 0.15; // If confidence difference < 15%, consider ambiguous
  const primaryIntent = topIntents[0];
  const ambiguousIntents = topIntents.filter(
    intent => Math.abs(intent.confidence - primaryIntent.confidence) < threshold
  );
  
  if (ambiguousIntents.length === 1) {
    return {
      disambiguatedIntent: primaryIntent.intent,
      confidence: primaryIntent.confidence,
      reasoning: 'Clear winner'
    };
  }
  
  // Apply disambiguation rules
  const disambiguated = applyDisambiguationRules(
    ambiguousIntents,
    message,
    context
  );
  
  return disambiguated;
}

/**
 * Apply disambiguation rules based on message characteristics
 * 
 * @param {Array} ambiguousIntents 
 * @param {string} message 
 * @param {Object} context 
 * @returns {Object}
 */
function applyDisambiguationRules(ambiguousIntents, message, context) {
  const intentTypes = ambiguousIntents.map(i => i.intent);
  const messageLower = message.toLowerCase();
  
  // Rule 1: GREETING vs QUESTION_GENERAL
  if (intentTypes.includes(IntentCategory.GREETING) && 
      intentTypes.includes(IntentCategory.QUESTION_GENERAL)) {
    
    // If message is very short and starts with greeting word, it's a greeting
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount <= 3 && /^(hi|hello|hey)/i.test(message)) {
      return selectIntent(ambiguousIntents, IntentCategory.GREETING, 'Short greeting detected');
    }
    
    // If it has a question mark or question words, it's a question
    if (message.includes('?') || /\b(what|how|why|when|where)\b/i.test(message)) {
      return selectIntent(ambiguousIntents, IntentCategory.QUESTION_GENERAL, 'Question detected');
    }
    
    // Default to greeting if unsure
    return selectIntent(ambiguousIntents, IntentCategory.GREETING, 'Default to greeting');
  }
  
  // Rule 2: QUESTION_SPECIFIC vs QUESTION_GENERAL
  if (intentTypes.includes(IntentCategory.QUESTION_SPECIFIC) && 
      intentTypes.includes(IntentCategory.QUESTION_GENERAL)) {
    
    // If mentions "my" or personal pronouns, it's specific
    if (/\b(my|mine|i|me)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.QUESTION_SPECIFIC, 'Personal pronouns detected');
    }
    
    // If user has active plans, lean towards specific
    if (context.hasDietPlan || context.hasWorkoutPlan) {
      return selectIntent(ambiguousIntents, IntentCategory.QUESTION_SPECIFIC, 'User has active plans');
    }
    
    // Default to general
    return selectIntent(ambiguousIntents, IntentCategory.QUESTION_GENERAL, 'No personal context');
  }
  
  // Rule 3: NUTRITION_INQUIRY vs RECIPE_REQUEST
  if (intentTypes.includes(IntentCategory.NUTRITION_INQUIRY) && 
      intentTypes.includes(IntentCategory.RECIPE_REQUEST)) {
    
    // If asks "how to make/cook", it's a recipe
    if (/how to (make|cook|prepare)/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.RECIPE_REQUEST, 'Cooking instructions requested');
    }
    
    // If asks about calories/macros, it's nutrition
    if (/\b(calories|protein|carbs|macros|nutrition)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.NUTRITION_INQUIRY, 'Nutrition info requested');
    }
    
    // If mentions "recipe", it's a recipe request
    if (/\brecipe\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.RECIPE_REQUEST, 'Recipe keyword detected');
    }
  }
  
  // Rule 4: PLAN_REQUEST vs PLAN_MODIFICATION
  if (intentTypes.includes(IntentCategory.PLAN_REQUEST) && 
      intentTypes.includes(IntentCategory.PLAN_MODIFICATION)) {
    
    // If mentions "new" or "create", it's a request
    if (/\b(new|create|make|generate)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.PLAN_REQUEST, 'Creation keywords detected');
    }
    
    // If mentions "change" or "modify", it's modification
    if (/\b(change|modify|update|replace|swap)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.PLAN_MODIFICATION, 'Modification keywords detected');
    }
    
    // If user has no plan, must be a request
    if (!context.hasDietPlan && !context.hasWorkoutPlan) {
      return selectIntent(ambiguousIntents, IntentCategory.PLAN_REQUEST, 'User has no existing plan');
    }
    
    // If user has plan, lean towards modification
    return selectIntent(ambiguousIntents, IntentCategory.PLAN_MODIFICATION, 'User has existing plan');
  }
  
  // Rule 5: WORKOUT_INQUIRY vs EXERCISE_TECHNIQUE
  if (intentTypes.includes(IntentCategory.WORKOUT_INQUIRY) && 
      intentTypes.includes(IntentCategory.EXERCISE_TECHNIQUE)) {
    
    // If asks about form/technique, it's technique
    if (/\b(form|technique|proper|correct|how to do)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.EXERCISE_TECHNIQUE, 'Form/technique keywords detected');
    }
    
    // If asks about sets/reps or schedule, it's workout inquiry
    if (/\b(sets|reps|schedule|routine|plan)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.WORKOUT_INQUIRY, 'Workout structure keywords detected');
    }
  }
  
  // Rule 6: PROGRESS_TRACKING vs HEALTH_METRICS
  if (intentTypes.includes(IntentCategory.PROGRESS_TRACKING) && 
      intentTypes.includes(IntentCategory.HEALTH_METRICS)) {
    
    // If mentions BMI/BMR/TDEE, it's health metrics
    if (/\b(bmi|bmr|tdee|calculate)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.HEALTH_METRICS, 'Calculation keywords detected');
    }
    
    // If mentions progress/tracking, it's progress tracking
    if (/\b(progress|track|log|record)\b/i.test(messageLower)) {
      return selectIntent(ambiguousIntents, IntentCategory.PROGRESS_TRACKING, 'Tracking keywords detected');
    }
  }
  
  // Rule 7: Context-based disambiguation
  if (context.previousIntent) {
    // If one of the ambiguous intents matches previous intent, boost it
    const matchingPrevious = ambiguousIntents.find(
      i => i.intent === context.previousIntent
    );
    
    if (matchingPrevious) {
      return {
        disambiguatedIntent: matchingPrevious.intent,
        confidence: matchingPrevious.confidence * 1.1, // Slight boost
        reasoning: 'Matches previous intent (conversation continuity)'
      };
    }
  }
  
  // Default: Return highest confidence intent
  const highest = ambiguousIntents.reduce((prev, current) => 
    current.confidence > prev.confidence ? current : prev
  );
  
  return {
    disambiguatedIntent: highest.intent,
    confidence: highest.confidence,
    reasoning: 'Highest confidence (no clear disambiguation rule)'
  };
}

/**
 * Helper to select specific intent from ambiguous list
 * 
 * @param {Array} ambiguousIntents 
 * @param {string} selectedIntent 
 * @param {string} reasoning 
 * @returns {Object}
 */
function selectIntent(ambiguousIntents, selectedIntent, reasoning) {
  const selected = ambiguousIntents.find(i => i.intent === selectedIntent);
  
  if (!selected) {
    // Fallback to highest confidence
    const highest = ambiguousIntents[0];
    return {
      disambiguatedIntent: highest.intent,
      confidence: highest.confidence,
      reasoning: `Intended ${selectedIntent} not found, using ${highest.intent}`
    };
  }
  
  return {
    disambiguatedIntent: selected.intent,
    confidence: selected.confidence * 1.05, // Small boost for disambiguation
    reasoning
  };
}

/**
 * Check if disambiguation is needed
 * 
 * @param {Array} topIntents 
 * @param {number} threshold - Confidence difference threshold
 * @returns {boolean}
 */
export function needsDisambiguation(topIntents, threshold = 0.15) {
  if (topIntents.length < 2) return false;
  
  const confidenceDiff = topIntents[0].confidence - topIntents[1].confidence;
  return confidenceDiff < threshold;
}

/**
 * Get disambiguation summary for logging
 * 
 * @param {Array} ambiguousIntents 
 * @param {Object} result 
 * @returns {string}
 */
export function getDisambiguationSummary(ambiguousIntents, result) {
  const intentsList = ambiguousIntents
    .map(i => `${i.intent}(${(i.confidence * 100).toFixed(0)}%)`)
    .join(' vs ');
  
  return `Ambiguous: [${intentsList}] → Selected: ${result.disambiguatedIntent} (${result.reasoning})`;
}
