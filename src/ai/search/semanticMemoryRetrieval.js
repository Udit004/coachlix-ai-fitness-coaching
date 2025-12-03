// src/ai/search/semanticMemoryRetrieval.js
// Enhanced RAG (Retrieval-Augmented Generation) for Professional Context Building
// Combines user profile, conversation history, and semantic search

import { getRecentChatHistory } from "../memory/chatMemory";
import { buildMinimalContext } from "./contextRetrieval";

/**
 * Memory relevance scoring for conversation history
 * Prioritizes recent messages and messages with similar topics
 * 
 * @param {Array} messages - Chat history messages
 * @param {string} currentMessage - Current user message
 * @param {number} maxMessages - Maximum messages to return
 * @returns {Array} - Ranked relevant messages
 */
function rankMessagesByRelevance(messages, currentMessage, maxMessages = 10) {
  const currentMessageLower = currentMessage.toLowerCase();
  const keywords = extractKeywords(currentMessage);
  
  const scoredMessages = messages.map((message, index) => {
    let score = 0;
    
    // Recency boost (more recent = higher score)
    const recencyScore = (index / messages.length) * 100;
    score += recencyScore;
    
    // Keyword matching (semantic similarity proxy)
    const messageContent = message.content?.toLowerCase() || '';
    const keywordMatches = keywords.filter(keyword => 
      messageContent.includes(keyword)
    ).length;
    score += keywordMatches * 20;
    
    // Same intent type (user vs AI messages)
    if (message.role === 'user') {
      score += 10; // Prioritize user messages for context
    }
    
    // Length penalty (very short messages less useful)
    if (messageContent.length < 20) {
      score -= 10;
    }
    
    return {
      message,
      score,
      index
    };
  });
  
  // Sort by score (highest first) and return top N
  return scoredMessages
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMessages)
    .map(item => item.message);
}

/**
 * Extract keywords from message for relevance matching
 * 
 * @param {string} message - User message
 * @returns {Array} - Array of keywords
 */
function extractKeywords(message) {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were', 'my', 'i', 'you', 'me', 'can', 'should', 'would', 'what', 'how', 'when'];
  
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Return unique keywords
  return [...new Set(words)];
}

/**
 * Build conversation summary from history
 * Useful for understanding user's journey and patterns
 * 
 * @param {Array} messages - Chat history
 * @returns {Object} - Summary statistics
 */
function analyzeConversationHistory(messages) {
  const summary = {
    totalMessages: messages.length,
    userMessages: 0,
    aiMessages: 0,
    topicsCovered: new Set(),
    questionsAsked: 0,
    planRequests: 0,
    nutritionQueries: 0,
    workoutQueries: 0
  };
  
  messages.forEach(msg => {
    const content = msg.content?.toLowerCase() || '';
    
    if (msg.role === 'user') {
      summary.userMessages++;
      
      // Analyze topics
      if (content.includes('diet') || content.includes('meal') || content.includes('food')) {
        summary.topicsCovered.add('nutrition');
        summary.nutritionQueries++;
      }
      if (content.includes('workout') || content.includes('exercise')) {
        summary.topicsCovered.add('fitness');
        summary.workoutQueries++;
      }
      if (content.includes('plan') || content.includes('create')) {
        summary.planRequests++;
      }
      if (content.includes('?')) {
        summary.questionsAsked++;
      }
    } else {
      summary.aiMessages++;
    }
  });
  
  summary.topicsCovered = Array.from(summary.topicsCovered);
  
  return summary;
}

/**
 * Build enhanced context with semantic memory retrieval
 * This is the RAG component that intelligently retrieves relevant information
 * 
 * @param {string} userId - User ID
 * @param {string} message - Current user message
 * @param {Object} options - { maxHistoryMessages, includeAnalysis }
 * @returns {Promise<Object>} - Enhanced context with RAG
 */
export async function buildEnhancedContext(userId, message, options = {}) {
  const {
    maxHistoryMessages = 10,
    includeAnalysis = true
  } = options;
  
  const startTime = Date.now();
  
  console.log('\n[SemanticMemory] 📚 Building enhanced context with RAG...');
  console.log('[SemanticMemory] User:', userId);
  console.log('[SemanticMemory] Message:', message.substring(0, 100) + '...');
  
  try {
    // Step 1: Get basic user context (profile, current plans)
    const baseContext = await buildMinimalContext(userId, message);
    
    // Step 2: Retrieve conversation history
    const allMessages = await getRecentChatHistory(userId, 20);
    
    console.log('[SemanticMemory] Retrieved', allMessages.length, 'historical messages');
    
    // Step 3: Rank messages by relevance to current query
    const relevantMessages = rankMessagesByRelevance(
      allMessages, 
      message, 
      maxHistoryMessages
    );
    
    console.log('[SemanticMemory] Filtered to', relevantMessages.length, 'relevant messages');
    
    // Step 4: Analyze conversation patterns
    let conversationAnalysis = null;
    if (includeAnalysis && allMessages.length > 0) {
      conversationAnalysis = analyzeConversationHistory(allMessages);
      console.log('[SemanticMemory] Topics covered:', conversationAnalysis.topicsCovered.join(', '));
    }
    
    // Step 5: Build enhanced context string
    let enhancedContext = baseContext.combined;
    
    // Add relevant conversation history
    if (relevantMessages.length > 0) {
      enhancedContext += '\n\n=== RELEVANT CONVERSATION HISTORY ===\n';
      
      // Group by topic/intent for better organization
      const recentExchanges = [];
      for (let i = 0; i < relevantMessages.length; i += 2) {
        const userMsg = relevantMessages[i];
        const aiMsg = relevantMessages[i + 1];
        
        if (userMsg && aiMsg) {
          recentExchanges.push({
            user: userMsg.content,
            ai: aiMsg.content?.substring(0, 150) + '...' // Truncate AI responses
          });
        }
      }
      
      // Add top 3-5 most relevant exchanges
      recentExchanges.slice(0, 5).forEach((exchange, idx) => {
        enhancedContext += `\nPrevious Q${idx + 1}: ${exchange.user}\n`;
        enhancedContext += `Previous A${idx + 1}: ${exchange.ai}\n`;
      });
    }
    
    // Add conversation insights
    if (conversationAnalysis && conversationAnalysis.topicsCovered.length > 0) {
      enhancedContext += '\n=== CONVERSATION INSIGHTS ===\n';
      enhancedContext += `Topics discussed: ${conversationAnalysis.topicsCovered.join(', ')}\n`;
      enhancedContext += `Questions asked: ${conversationAnalysis.questionsAsked}\n`;
      if (conversationAnalysis.planRequests > 0) {
        enhancedContext += `Plan requests: ${conversationAnalysis.planRequests}\n`;
      }
    }
    
    // Truncate if too long (keep under 3000 chars for efficiency)
    if (enhancedContext.length > 3000) {
      enhancedContext = enhancedContext.substring(0, 3000) + '\n...[Context truncated for efficiency]';
    }
    
    const retrievalTime = Date.now() - startTime;
    
    console.log('[SemanticMemory] ✅ Enhanced context built');
    console.log('[SemanticMemory] Total length:', enhancedContext.length, 'chars');
    console.log('[SemanticMemory] Retrieval time:', retrievalTime, 'ms');
    
    return {
      ...baseContext,
      combined: enhancedContext,
      relevantHistory: relevantMessages,
      conversationAnalysis,
      retrievalTime,
      hasHistory: relevantMessages.length > 0,
      historyCount: relevantMessages.length
    };
    
  } catch (error) {
    console.error('[SemanticMemory] ❌ Error building enhanced context:', error);
    
    // Fallback to basic context
    const baseContext = await buildMinimalContext(userId, message);
    return {
      ...baseContext,
      relevantHistory: [],
      conversationAnalysis: null,
      retrievalTime: Date.now() - startTime,
      hasHistory: false,
      historyCount: 0,
      error: error.message
    };
  }
}

/**
 * Build lightweight context for simple queries
 * Skips history retrieval for greetings and basic questions
 * 
 * @param {string} userId - User ID
 * @param {string} message - Current user message
 * @returns {Promise<Object>} - Lightweight context
 */
export async function buildLightweightContext(userId, message) {
  console.log('[SemanticMemory] 💨 Using lightweight context (no history)');
  
  const baseContext = await buildMinimalContext(userId, message);
  
  return {
    ...baseContext,
    relevantHistory: [],
    conversationAnalysis: null,
    retrievalTime: 0,
    hasHistory: false,
    historyCount: 0,
    isLightweight: true
  };
}

/**
 * Smart context builder - decides between enhanced vs lightweight
 * 
 * @param {string} userId - User ID
 * @param {string} message - Current user message
 * @param {Object} intent - Intent classification
 * @returns {Promise<Object>} - Appropriate context
 */
export async function buildSmartContext(userId, message, intent) {
  // Simple intents don't need full history
  const lightweightIntents = ['greeting', 'motivation', 'feedback'];
  
  if (lightweightIntents.includes(intent.intent) && intent.confidence > 0.8) {
    return await buildLightweightContext(userId, message);
  }
  
  // Complex intents need full context with RAG
  return await buildEnhancedContext(userId, message, {
    maxHistoryMessages: intent.requiresData ? 10 : 5,
    includeAnalysis: intent.dataNeeds?.priority === 'high'
  });
}

/**
 * Format context for LLM prompt
 * 
 * @param {Object} context - Context object from build functions
 * @returns {string} - Formatted context string
 */
export function formatContextForPrompt(context) {
  return context.combined;
}

/**
 * Get context statistics for debugging
 * 
 * @param {Object} context - Context object
 * @returns {Object} - Statistics
 */
export function getContextStats(context) {
  return {
    totalLength: context.combined?.length || 0,
    hasProfile: !!context.profile,
    hasDiet: !!context.diet,
    hasWorkout: !!context.workout,
    hasHistory: context.hasHistory || false,
    historyCount: context.historyCount || 0,
    isLightweight: context.isLightweight || false,
    retrievalTime: context.retrievalTime || 0
  };
}
