// src/ai/reasoning/intent/scoring.js
// Advanced scoring algorithms for intent classification
// Uses weighted features and confidence calculation

import { findFuzzyMatches, scoreFuzzyMatches, fuzzyPatternMatch } from './fuzzyMatching.js';

/**
 * Feature weights for scoring (OPTIMIZED for 80-90% accuracy)
 * Higher weight = more important for classification
 * 
 * Tuning notes:
 * - Exact matches are very strong signals (3.0x)
 * - Pattern matches are strong (2.0x) 
 * - Keywords need more weight to compete (0.5x)
 * - Negative patterns are strong disqualifiers (-3.0x)
 * - Context boost increased for better follow-up detection
 */
const FEATURE_WEIGHTS = {
  exactMatch: 3.0,           // Exact phrase match (e.g., "hi" for greeting) - INCREASED
  patternMatch: 2.0,         // Regex pattern match - INCREASED
  keywordMatch: 0.5,         // Single keyword match - INCREASED
  fuzzyKeywordMatch: 0.3,    // Fuzzy keyword match - INCREASED
  negativePattern: -3.0,     // Negative pattern match (disqualifies intent) - STRONGER
  contextBoost: 0.8,         // Context-based boost - INCREASED
  priorityBoost: 0.15        // Priority-based boost - INCREASED
};

/**
 * Calculate base score for an intent based on pattern matching
 * 
 * @param {string} message - User message
 * @param {string} messageLower - Lowercase message
 * @param {Object} patternConfig - Intent pattern configuration
 * @returns {Object} - { score, matches, reasoning }
 */
export function calculateBaseScore(message, messageLower, patternConfig) {
  let score = 0;
  const matches = {
    exactMatches: [],
    patternMatches: [],
    keywordMatches: [],
    fuzzyMatches: [],
    negativeMatches: []
  };
  
  // 1. Check exact matches (highest confidence)
  if (patternConfig.exactMatches) {
    for (const exactPhrase of patternConfig.exactMatches) {
      if (messageLower === exactPhrase.toLowerCase()) {
        score += FEATURE_WEIGHTS.exactMatch;
        matches.exactMatches.push(exactPhrase);
      }
    }
  }
  
  // 2. Check negative patterns (disqualifiers)
  if (patternConfig.negativePatterns) {
    for (const negPattern of patternConfig.negativePatterns) {
      if (fuzzyPatternMatch(message, negPattern, false)) {
        score += FEATURE_WEIGHTS.negativePattern;
        matches.negativeMatches.push(negPattern.toString());
        // Early exit if negative pattern matches strongly
        if (score < -1.0) {
          return { score: 0, matches, reasoning: 'Negative pattern matched' };
        }
      }
    }
  }
  
  // 3. Check regex patterns (strong signal)
  if (patternConfig.patterns) {
    for (const pattern of patternConfig.patterns) {
      if (fuzzyPatternMatch(message, pattern, true)) {
        score += FEATURE_WEIGHTS.patternMatch;
        matches.patternMatches.push(pattern.toString());
      }
    }
  }
  
  // 4. Check keyword matches (with fuzzy tolerance)
  if (patternConfig.keywords) {
    const fuzzyMatches = findFuzzyMatches(message, patternConfig.keywords, 0.8);
    const fuzzyScore = scoreFuzzyMatches(fuzzyMatches);
    
    // Separate exact and fuzzy keyword matches
    const exactKeywords = fuzzyMatches.filter(m => m.matchType === 'exact');
    const fuzzyKeywords = fuzzyMatches.filter(m => m.matchType === 'fuzzy');
    
    score += exactKeywords.length * FEATURE_WEIGHTS.keywordMatch;
    score += fuzzyKeywords.length * FEATURE_WEIGHTS.fuzzyKeywordMatch;
    
    matches.keywordMatches = exactKeywords.map(m => m.keyword);
    matches.fuzzyMatches = fuzzyKeywords.map(m => ({
      keyword: m.keyword,
      matched: m.matched,
      similarity: m.similarity
    }));
  }
  
  const reasoning = buildScoreReasoning(matches, score);
  
  return { score, matches, reasoning };
}

/**
 * Apply context-based boosting to score
 * 
 * @param {number} baseScore 
 * @param {string} intentType 
 * @param {Object} context - User context
 * @param {Object} patternConfig 
 * @returns {number} - Boosted score
 */
export function applyContextBoost(baseScore, intentType, context, patternConfig) {
  let boostedScore = baseScore;
  
  // Context hints from pattern config
  const hints = patternConfig.contextHints || {};
  
  // Boost if user has relevant data
  if (intentType.includes('NUTRITION') && context.hasDietPlan) {
    boostedScore += FEATURE_WEIGHTS.contextBoost;
  }
  
  if (intentType.includes('WORKOUT') && context.hasWorkoutPlan) {
    boostedScore += FEATURE_WEIGHTS.contextBoost;
  }
  
  // Boost if conversation history suggests this intent
  if (context.previousIntent === intentType) {
    boostedScore += FEATURE_WEIGHTS.contextBoost * 0.5; // Smaller boost for follow-ups
  }
  
  // Apply priority boost
  if (patternConfig.priority) {
    boostedScore += (patternConfig.priority / 10) * FEATURE_WEIGHTS.priorityBoost;
  }
  
  return boostedScore;
}

/**
 * Validate score against context hints
 * Some intents have specific requirements (e.g., greetings must be short)
 * 
 * @param {number} score 
 * @param {string} message 
 * @param {Object} patternConfig 
 * @returns {number} - Validated score (may be reduced)
 */
export function validateScoreAgainstHints(score, message, patternConfig) {
  const hints = patternConfig.contextHints || {};
  let validatedScore = score;
  
  // Check max words constraint
  if (hints.maxWords) {
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > hints.maxWords) {
      validatedScore *= 0.5; // Penalize if too long
    }
  }
  
  // Check if it requires start of message
  if (hints.requiresStartOfMessage) {
    const firstWord = message.trim().split(/\s+/)[0].toLowerCase();
    const hasStartMatch = patternConfig.exactMatches?.some(
      phrase => firstWord === phrase.toLowerCase().split(/\s+/)[0]
    );
    
    if (!hasStartMatch) {
      validatedScore *= 0.7; // Penalize if doesn't start correctly
    }
  }
  
  // Check if food should be mentioned
  if (hints.foodMentioned) {
    const hasFoodKeywords = /\b(food|meal|eat|diet|nutrition|recipe|cook|breakfast|lunch|dinner)\b/i.test(message);
    if (!hasFoodKeywords) {
      validatedScore *= 0.8;
    }
  }
  
  // Check if exercise should be mentioned
  if (hints.exerciseMentioned) {
    const hasExerciseKeywords = /\b(exercise|workout|train|gym|fitness|run|walk|lift)\b/i.test(message);
    if (!hasExerciseKeywords) {
      validatedScore *= 0.8;
    }
  }
  
  return validatedScore;
}

/**
 * Convert raw score to confidence (0-1)
 * Uses improved sigmoid-like function for better confidence distribution
 * 
 * @param {number} rawScore 
 * @param {number} baseConfidence - Base confidence from pattern config
 * @returns {number} - Confidence between 0 and 1
 */
export function scoreToConfidence(rawScore, baseConfidence = 0.7) {
  // Negative scores = very low confidence
  if (rawScore <= 0) {
    return 0.05; // Changed from 0.1 to be more conservative
  }
  
  // Very high scores get boosted
  if (rawScore >= 5.0) {
    return Math.min(0.95, baseConfidence * 1.2);
  }
  
  // Improved sigmoid function with better scaling
  // This creates a smoother curve from 0 to 1
  const scaledScore = rawScore / 4.0; // Adjusted scaling for new weights
  const sigmoid = 1 / (1 + Math.exp(-scaledScore));
  
  // Blend with base confidence (70% sigmoid, 30% base)
  const confidence = (sigmoid * 0.7) + (baseConfidence * 0.3);
  
  // Clamp between 0.05 and 0.98 (avoid absolute certainty)
  return Math.max(0.05, Math.min(0.98, confidence));
}

/**
 * Calculate final confidence score for an intent
 * 
 * @param {string} message 
 * @param {string} intentType 
 * @param {Object} patternConfig 
 * @param {Object} context 
 * @returns {Object} - { confidence, score, matches, reasoning }
 */
export function calculateIntentScore(message, intentType, patternConfig, context = {}) {
  const messageLower = message.toLowerCase().trim();
  
  // Step 1: Calculate base score from pattern matching
  const { score: baseScore, matches, reasoning: baseReasoning } = calculateBaseScore(
    message,
    messageLower,
    patternConfig
  );
  
  // Step 2: Apply context boost
  const boostedScore = applyContextBoost(baseScore, intentType, context, patternConfig);
  
  // Step 3: Validate against context hints
  const validatedScore = validateScoreAgainstHints(boostedScore, message, patternConfig);
  
  // Step 4: Convert to confidence
  const confidence = scoreToConfidence(validatedScore, patternConfig.confidence);
  
  // Build detailed reasoning
  const reasoning = {
    baseScore: baseScore.toFixed(2),
    boostedScore: boostedScore.toFixed(2),
    validatedScore: validatedScore.toFixed(2),
    confidence: confidence.toFixed(2),
    matches,
    explanation: baseReasoning
  };
  
  return {
    confidence,
    score: validatedScore,
    matches,
    reasoning
  };
}

/**
 * Build human-readable reasoning for score
 * 
 * @param {Object} matches 
 * @param {number} score 
 * @returns {string}
 */
function buildScoreReasoning(matches, score) {
  const parts = [];
  
  if (matches.exactMatches.length > 0) {
    parts.push(`Exact: ${matches.exactMatches.join(', ')}`);
  }
  
  if (matches.patternMatches.length > 0) {
    parts.push(`Patterns: ${matches.patternMatches.length}`);
  }
  
  if (matches.keywordMatches.length > 0) {
    parts.push(`Keywords: ${matches.keywordMatches.join(', ')}`);
  }
  
  if (matches.fuzzyMatches.length > 0) {
    const fuzzyKeywords = matches.fuzzyMatches.map(m => 
      `${m.keyword}(~${(m.similarity * 100).toFixed(0)}%)`
    );
    parts.push(`Fuzzy: ${fuzzyKeywords.join(', ')}`);
  }
  
  if (matches.negativeMatches.length > 0) {
    parts.push(`⚠️ Negative patterns: ${matches.negativeMatches.length}`);
  }
  
  if (parts.length === 0) {
    return 'No matches';
  }
  
  return parts.join(' | ');
}

/**
 * Compare two intent scores and return the better one
 * 
 * @param {Object} score1 
 * @param {Object} score2 
 * @returns {Object} - Better score
 */
export function compareBestScore(score1, score2) {
  if (!score1) return score2;
  if (!score2) return score1;
  
  // Primary: Compare confidence
  if (score1.confidence > score2.confidence) {
    return score1;
  } else if (score2.confidence > score1.confidence) {
    return score2;
  }
  
  // Secondary: Compare raw score
  if (score1.score > score2.score) {
    return score1;
  }
  
  return score2;
}
