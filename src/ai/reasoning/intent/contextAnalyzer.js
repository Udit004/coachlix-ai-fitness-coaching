// src/ai/reasoning/intent/contextAnalyzer.js
// Analyzes conversation history and context for better intent classification
// Helps understand follow-up questions and context-dependent intents

/**
 * Analyze conversation history to extract context
 * 
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @returns {Object} - Context information
 */
export function analyzeConversationHistory(conversationHistory = []) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return {
      isFollowUp: false,
      previousIntent: null,
      previousTopic: null,
      contextLength: 0,
      hasHistory: false,
      recentTopics: [],
      conversationPhase: 'initial'
    };
  }
  
  const contextLength = conversationHistory.length;
  const isFollowUp = contextLength > 0;
  
  // Get last few user messages
  const userMessages = conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-3); // Last 3 user messages
  
  // Detect previous topic
  const previousTopic = detectTopicFromMessages(userMessages);
  
  // Detect recent topics
  const recentTopics = extractRecentTopics(userMessages);
  
  // Determine conversation phase
  const conversationPhase = determineConversationPhase(conversationHistory);
  
  return {
    isFollowUp,
    previousIntent: null, // Will be set by classifier
    previousTopic,
    contextLength,
    hasHistory: contextLength > 2,
    recentTopics,
    conversationPhase,
    lastUserMessage: userMessages[userMessages.length - 1]?.content || null
  };
}

/**
 * Detect topic from recent messages
 * 
 * @param {Array} messages 
 * @returns {string|null}
 */
function detectTopicFromMessages(messages) {
  if (!messages || messages.length === 0) return null;
  
  const topicKeywords = {
    diet: ['diet', 'meal', 'food', 'eat', 'nutrition', 'calories', 'recipe'],
    workout: ['workout', 'exercise', 'train', 'gym', 'fitness', 'reps', 'sets'],
    progress: ['progress', 'weight', 'lost', 'gained', 'tracking', 'goal'],
    health: ['health', 'bmi', 'bmr', 'body fat', 'metrics'],
    motivation: ['motivated', 'tired', 'give up', 'difficult', 'hard']
  };
  
  // Combine all messages
  const combinedText = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Count topic mentions
  const topicScores = {};
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    topicScores[topic] = keywords.filter(kw => combinedText.includes(kw)).length;
  }
  
  // Return topic with highest score
  const sortedTopics = Object.entries(topicScores)
    .sort((a, b) => b[1] - a[1]);
  
  return sortedTopics[0][1] > 0 ? sortedTopics[0][0] : null;
}

/**
 * Extract recent topics from conversation
 * 
 * @param {Array} messages 
 * @returns {Array<string>}
 */
function extractRecentTopics(messages) {
  const topics = new Set();
  
  for (const message of messages) {
    const text = message.content.toLowerCase();
    
    if (/\b(diet|meal|food|nutrition)\b/.test(text)) topics.add('diet');
    if (/\b(workout|exercise|train|gym)\b/.test(text)) topics.add('workout');
    if (/\b(progress|weight|tracking)\b/.test(text)) topics.add('progress');
    if (/\b(recipe|cook|prepare)\b/.test(text)) topics.add('recipe');
    if (/\b(motivation|tired|give up)\b/.test(text)) topics.add('motivation');
  }
  
  return Array.from(topics);
}

/**
 * Determine what phase of conversation we're in
 * 
 * @param {Array} conversationHistory 
 * @returns {string} - 'initial', 'exploration', 'action', 'follow_up'
 */
function determineConversationPhase(conversationHistory) {
  const messageCount = conversationHistory.length;
  
  if (messageCount <= 2) return 'initial';
  if (messageCount <= 6) return 'exploration';
  if (messageCount <= 12) return 'action';
  return 'follow_up';
}

/**
 * Detect if current message is a follow-up to previous topic
 * 
 * @param {string} currentMessage 
 * @param {Object} conversationContext 
 * @returns {boolean}
 */
export function isFollowUpQuestion(currentMessage, conversationContext) {
  if (!conversationContext.isFollowUp) return false;
  
  const messageLower = currentMessage.toLowerCase().trim();
  
  // Follow-up indicators
  const followUpIndicators = [
    /^(and|also|what about|how about)/i,
    /^(can you|could you|will you) (also|too)/i,
    /\b(more|another|different|alternative)\b/i,
    /^(what|how) (else|other)/i,
    /\b(instead|rather than)\b/i
  ];
  
  const hasFollowUpIndicator = followUpIndicators.some(pattern => 
    pattern.test(messageLower)
  );
  
  // Check if message is very short (likely a follow-up)
  const isShort = messageLower.split(/\s+/).length <= 5;
  
  // Check if message references previous topic
  const referencesPreviousTopic = conversationContext.previousTopic && 
    messageLower.includes(conversationContext.previousTopic);
  
  return hasFollowUpIndicator || (isShort && referencesPreviousTopic);
}

/**
 * Boost intent score based on conversation context
 * 
 * @param {string} intentType 
 * @param {Object} conversationContext 
 * @returns {number} - Boost multiplier (1.0 = no boost)
 */
export function getContextBoostMultiplier(intentType, conversationContext) {
  let multiplier = 1.0;
  
  // Boost if intent matches previous topic
  if (conversationContext.previousTopic) {
    const topicIntentMap = {
      'diet': ['NUTRITION_INQUIRY', 'RECIPE_REQUEST', 'FOOD_COMPARISON', 'QUESTION_SPECIFIC'],
      'workout': ['WORKOUT_INQUIRY', 'EXERCISE_TECHNIQUE', 'QUESTION_SPECIFIC'],
      'progress': ['PROGRESS_TRACKING', 'HEALTH_METRICS'],
      'recipe': ['RECIPE_REQUEST', 'NUTRITION_INQUIRY'],
      'motivation': ['MOTIVATION']
    };
    
    const relatedIntents = topicIntentMap[conversationContext.previousTopic] || [];
    if (relatedIntents.includes(intentType)) {
      multiplier *= 1.2; // 20% boost
    }
  }
  
  // Boost based on conversation phase
  if (conversationContext.conversationPhase === 'action') {
    // In action phase, boost action-oriented intents
    const actionIntents = ['PLAN_REQUEST', 'PLAN_MODIFICATION', 'PROGRESS_TRACKING'];
    if (actionIntents.includes(intentType)) {
      multiplier *= 1.1;
    }
  }
  
  return multiplier;
}

/**
 * Detect pronoun references that indicate follow-up
 * e.g., "What about that?", "Can I change it?"
 * 
 * @param {string} message 
 * @returns {boolean}
 */
export function hasPronounReference(message) {
  const pronounPatterns = [
    /\b(it|that|this|those|these)\b/i,
    /\b(the same|similar)\b/i
  ];
  
  return pronounPatterns.some(pattern => pattern.test(message));
}

/**
 * Analyze if message needs context from previous messages
 * 
 * @param {string} message 
 * @returns {Object} - { needsContext, reason }
 */
export function analyzeContextDependency(message) {
  const messageLower = message.toLowerCase().trim();
  
  // Check for incomplete questions
  const isIncomplete = /^(what about|how about|and|also|or)\b/i.test(messageLower);
  
  // Check for pronoun references
  const hasPronouns = hasPronounReference(message);
  
  // Check for very short messages (likely need context)
  const isVeryShort = messageLower.split(/\s+/).length <= 3;
  
  // Check for comparative language
  const isComparative = /\b(instead|rather|alternative|different|other|another)\b/i.test(messageLower);
  
  const needsContext = isIncomplete || (hasPronouns && isVeryShort) || isComparative;
  
  let reason = null;
  if (isIncomplete) reason = 'Incomplete question';
  else if (hasPronouns && isVeryShort) reason = 'Pronoun reference in short message';
  else if (isComparative) reason = 'Comparative language';
  
  return { needsContext, reason };
}

/**
 * Get context summary for debugging
 * 
 * @param {Object} conversationContext 
 * @returns {string}
 */
export function getContextSummary(conversationContext) {
  const parts = [];
  
  parts.push(`Phase: ${conversationContext.conversationPhase}`);
  
  if (conversationContext.previousTopic) {
    parts.push(`Topic: ${conversationContext.previousTopic}`);
  }
  
  if (conversationContext.recentTopics.length > 0) {
    parts.push(`Recent: ${conversationContext.recentTopics.join(', ')}`);
  }
  
  parts.push(`Messages: ${conversationContext.contextLength}`);
  
  return parts.join(' | ');
}
