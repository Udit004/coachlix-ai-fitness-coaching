// src/ai/reasoning/intentClassifierV2.js
// ENHANCED INTENT CLASSIFIER V2 - Phase 1 Implementation
// 
// Improvements over V1:
// ✅ Comprehensive pattern coverage with typo tolerance
// ✅ Advanced scoring with weighted features
// ✅ Fuzzy matching for abbreviations and variations
// ✅ Multi-intent detection
// ✅ Context-aware classification
// ✅ Disambiguation logic
// ✅ Enhanced entity extraction
//
// Target: 80-90% accuracy with rule-based classification

import { IntentCategory, intentPatterns, getHighPriorityIntents } from './intent/patterns.js';
import { calculateIntentScore, compareBestScore } from './intent/scoring.js';
import { normalizeMessage } from './intent/fuzzyMatching.js';
import { analyzeConversationHistory, getContextBoostMultiplier, analyzeContextDependency } from './intent/contextAnalyzer.js';
import { detectMultipleIntents, getMultiIntentStrategy, mergeDataRequirements } from './intent/multiIntent.js';
import { disambiguateIntents, needsDisambiguation } from './intent/disambiguation.js';
import { extractEntities, getEntityStats, formatEntitiesForLogging } from './entities/extractor.js';

/**
 * Configuration for V2 classifier
 */
const CLASSIFIER_CONFIG = {
  // Confidence thresholds
  highConfidenceThreshold: 0.75,    // Above this = high confidence
  lowConfidenceThreshold: 0.40,     // Below this = needs LLM fallback
  disambiguationThreshold: 0.15,    // Confidence gap for disambiguation
  
  // Multi-intent detection
  enableMultiIntent: true,
  multiIntentConfidenceGap: 0.3,
  
  // Context awareness
  useConversationContext: true,
  contextBoostEnabled: true,
  
  // Performance
  checkHighPriorityFirst: true,     // Check high-priority intents first
  maxIntentsToScore: 20,            // Limit intents to score (performance)
  
  // Debugging
  verboseLogging: false              // Set to true for debugging
};

/**
 * Main intent classification function (V2)
 * 
 * @param {string} message - User message
 * @param {Object} context - User context (profile, plans, history)
 * @returns {Object} - Classification result
 */
export function classifyIntent(message, context = {}) {
  const startTime = Date.now();
  
  // Validate input
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      intent: IntentCategory.CLARIFICATION_NEEDED,
      confidence: 1.0,
      requiresData: false,
      reasoning: 'Empty or invalid message',
      version: 'v2'
    };
  }
  
  // Step 1: Normalize message
  const normalizedMessage = normalizeMessage(message);
  const messageLower = normalizedMessage.toLowerCase().trim();
  
  // Step 2: Analyze conversation context
  const conversationContext = CLASSIFIER_CONFIG.useConversationContext
    ? analyzeConversationHistory(context.conversationHistory)
    : { isFollowUp: false };
  
  // Step 3: Check context dependency
  const contextDependency = analyzeContextDependency(message);
  
  // Step 4: Score all intents
  const allIntentScores = scoreAllIntents(
    normalizedMessage,
    messageLower,
    {
      ...context,
      conversationContext,
      contextDependency
    }
  );
  
  // Step 5: Sort by confidence
  const sortedIntents = allIntentScores
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Keep top 5
  
  if (sortedIntents.length === 0) {
    return {
      intent: IntentCategory.QUESTION_GENERAL,
      confidence: 0.5,
      requiresData: false,
      reasoning: 'No patterns matched - defaulting to general question',
      version: 'v2'
    };
  }
  
  // Step 6: Multi-intent detection
  let multiIntentResult = null;
  if (CLASSIFIER_CONFIG.enableMultiIntent) {
    multiIntentResult = detectMultipleIntents(message, sortedIntents);
  }
  
  // Step 7: Disambiguation (if needed)
  let finalIntent = sortedIntents[0];
  let disambiguationApplied = false;
  
  if (needsDisambiguation(sortedIntents, CLASSIFIER_CONFIG.disambiguationThreshold)) {
    const disambiguated = disambiguateIntents(
      sortedIntents.slice(0, 3),
      message,
      { ...context, conversationContext }
    );
    
    if (disambiguated) {
      finalIntent = {
        intent: disambiguated.disambiguatedIntent,
        confidence: disambiguated.confidence,
        reasoning: disambiguated.reasoning
      };
      disambiguationApplied = true;
    }
  }
  
  // Step 8: Extract entities
  const entities = extractEntities(message);
  const entityStats = getEntityStats(entities);
  
  // Step 9: Determine data requirements
  const dataNeeds = determineDataRequirements(
    finalIntent.intent,
    message,
    entities,
    multiIntentResult
  );
  
  // Step 10: Build final result
  const classificationTime = Date.now() - startTime;
  
  const result = {
    // Primary classification
    intent: finalIntent.intent,
    confidence: finalIntent.confidence,
    requiresData: intentPatterns[finalIntent.intent]?.requiresData || false,
    
    // Data requirements
    dataNeeds,
    
    // Entities
    entities,
    entityStats,
    
    // Multi-intent
    hasMultipleIntents: multiIntentResult?.hasMultipleIntents || false,
    multiIntentResult,
    
    // Context
    conversationContext,
    contextDependency,
    
    // Metadata
    disambiguationApplied,
    allCandidates: sortedIntents.slice(0, 3).map(i => ({
      intent: i.intent,
      confidence: i.confidence
    })),
    
    // Performance
    classificationTime,
    version: 'v2',
    
    // Reasoning
    reasoning: buildDetailedReasoning(finalIntent, multiIntentResult, disambiguationApplied),
    
    // Timestamp
    timestamp: new Date().toISOString()
  };
  
  // Log results
  if (CLASSIFIER_CONFIG.verboseLogging) {
    logClassificationResult(message, result);
  }
  
  return result;
}

/**
 * Score all intents against the message
 * 
 * @param {string} normalizedMessage 
 * @param {string} messageLower 
 * @param {Object} context 
 * @returns {Array} - Array of scored intents
 */
function scoreAllIntents(normalizedMessage, messageLower, context) {
  const scores = [];
  
  // Get intents to check (prioritize high-priority ones)
  const intentsToCheck = CLASSIFIER_CONFIG.checkHighPriorityFirst
    ? getHighPriorityIntents()
    : Object.keys(intentPatterns);
  
  for (const intentType of intentsToCheck) {
    const patternConfig = intentPatterns[intentType];
    
    if (!patternConfig) continue;
    
    // Calculate score
    const scoreResult = calculateIntentScore(
      normalizedMessage,
      intentType,
      patternConfig,
      {
        ...context,
        hasDietPlan: context.hasDietPlan || false,
        hasWorkoutPlan: context.hasWorkoutPlan || false
      }
    );
    
    // Apply context boost
    let finalConfidence = scoreResult.confidence;
    if (CLASSIFIER_CONFIG.contextBoostEnabled && context.conversationContext) {
      const boostMultiplier = getContextBoostMultiplier(
        intentType,
        context.conversationContext
      );
      finalConfidence = Math.min(1.0, finalConfidence * boostMultiplier);
    }
    
    scores.push({
      intent: intentType,
      confidence: finalConfidence,
      score: scoreResult.score,
      matches: scoreResult.matches,
      reasoning: scoreResult.reasoning
    });
  }
  
  return scores;
}

/**
 * Determine data requirements based on intent and entities
 * 
 * @param {string} intent 
 * @param {string} message 
 * @param {Object} entities 
 * @param {Object} multiIntentResult 
 * @returns {Object}
 */
function determineDataRequirements(intent, message, entities, multiIntentResult) {
  const messageLower = message.toLowerCase();
  
  // Base requirements
  let requirements = {
    needsProfile: true,  // Always need basic profile
    needsDiet: false,
    needsWorkout: false,
    needsHistory: false,
    needsVectorSearch: false,
    priority: 'low'
  };
  
  // If multi-intent, merge requirements
  if (multiIntentResult?.hasMultipleIntents) {
    const allIntents = [
      multiIntentResult.primaryIntent,
      ...multiIntentResult.secondaryIntents
    ];
    return mergeDataRequirements(allIntents);
  }
  
  // Single intent requirements
  switch (intent) {
    case IntentCategory.GREETING:
      requirements.priority = 'low';
      requirements.needsProfile = false; // Don't need profile for simple greeting
      break;
      
    case IntentCategory.QUESTION_SPECIFIC:
      // User asking about THEIR specific plan
      requirements.needsDiet = messageLower.includes('diet') || messageLower.includes('meal');
      requirements.needsWorkout = messageLower.includes('workout') || messageLower.includes('exercise');
      requirements.needsHistory = true;
      requirements.priority = 'high';
      break;
      
    case IntentCategory.NUTRITION_INQUIRY:
    case IntentCategory.FOOD_COMPARISON:
      // General nutrition questions - don't need user's diet plan
      requirements.needsProfile = true;  // Only basic profile for context
      requirements.needsDiet = false;    // Don't need diet plan
      requirements.needsWorkout = false; // Don't need workout plan
      requirements.needsHistory = false; // Don't need history
      requirements.priority = 'low';
      break;
      
    case IntentCategory.WORKOUT_INQUIRY:
    case IntentCategory.EXERCISE_TECHNIQUE:
      requirements.needsWorkout = true;
      requirements.needsHistory = true;
      requirements.priority = 'high';
      break;
      
    case IntentCategory.PLAN_REQUEST:
      requirements.needsProfile = true;
      requirements.needsHistory = true;
      requirements.priority = 'high';
      break;
      
    case IntentCategory.PLAN_MODIFICATION:
      requirements.needsDiet = messageLower.includes('diet') || messageLower.includes('meal');
      requirements.needsWorkout = messageLower.includes('workout') || messageLower.includes('exercise');
      requirements.needsHistory = true;
      requirements.priority = 'high';
      break;
      
    case IntentCategory.HEALTH_METRICS:
      requirements.needsProfile = true;
      requirements.priority = 'high';
      break;
      
    case IntentCategory.PROGRESS_TRACKING:
      requirements.needsDiet = true;
      requirements.needsWorkout = true;
      requirements.needsHistory = true;
      requirements.priority = 'medium';
      break;
      
    case IntentCategory.RECIPE_REQUEST:
    case IntentCategory.SUPPLEMENT_INQUIRY:
      requirements.needsVectorSearch = true;
      requirements.priority = 'medium';
      break;
      
    case IntentCategory.QUESTION_GENERAL:
      requirements.needsVectorSearch = true;
      requirements.needsHistory = true;
      requirements.priority = 'medium';
      break;
      
    default:
      requirements.priority = 'low';
  }
  
  return requirements;
}

/**
 * Build detailed reasoning string
 * 
 * @param {Object} finalIntent 
 * @param {Object} multiIntentResult 
 * @param {boolean} disambiguationApplied 
 * @returns {string}
 */
function buildDetailedReasoning(finalIntent, multiIntentResult, disambiguationApplied) {
  const parts = [];
  
  // Base reasoning
  if (finalIntent.reasoning) {
    if (typeof finalIntent.reasoning === 'string') {
      parts.push(finalIntent.reasoning);
    } else if (finalIntent.reasoning.explanation) {
      parts.push(finalIntent.reasoning.explanation);
    }
  }
  
  // Multi-intent
  if (multiIntentResult?.hasMultipleIntents) {
    parts.push(`Multi-intent detected: ${multiIntentResult.secondaryIntents.length + 1} intents`);
  }
  
  // Disambiguation
  if (disambiguationApplied) {
    parts.push('Disambiguation applied');
  }
  
  return parts.join(' | ');
}

/**
 * Log classification result
 * 
 * @param {string} message 
 * @param {Object} result 
 */
function logClassificationResult(message, result) {
  console.log('\n[IntentClassifierV2] 🎯 Classification Complete');
  console.log('[IntentClassifierV2] Message:', message.substring(0, 60) + (message.length > 60 ? '...' : ''));
  console.log('[IntentClassifierV2] Intent:', result.intent);
  console.log('[IntentClassifierV2] Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('[IntentClassifierV2] Requires Data:', result.requiresData);
  console.log('[IntentClassifierV2] Priority:', result.dataNeeds.priority);
  
  if (result.hasMultipleIntents) {
    console.log('[IntentClassifierV2] 🔀 Multi-Intent:', 
      result.multiIntentResult.secondaryIntents.map(i => i.intent).join(', ')
    );
  }
  
  if (result.disambiguationApplied) {
    console.log('[IntentClassifierV2] 🔍 Disambiguation: Applied');
  }
  
  if (result.entityStats.hasEntities) {
    console.log('[IntentClassifierV2] 📦 Entities:', formatEntitiesForLogging(result.entities));
  }
  
  if (result.allCandidates.length > 1) {
    console.log('[IntentClassifierV2] 📊 Top Candidates:');
    result.allCandidates.forEach((candidate, idx) => {
      console.log(`  ${idx + 1}. ${candidate.intent} (${(candidate.confidence * 100).toFixed(1)}%)`);
    });
  }
  
  console.log('[IntentClassifierV2] ⏱️  Time:', result.classificationTime + 'ms');
  console.log('[IntentClassifierV2] Reasoning:', result.reasoning);
}

/**
 * Analyze intent - Main entry point (compatible with V1 API)
 * 
 * @param {string} message 
 * @param {Object} context 
 * @returns {Object}
 */
export function analyzeIntent(message, context = {}) {
  return classifyIntent(message, context);
}

// Export for backward compatibility
export { IntentCategory } from './intent/patterns.js';
