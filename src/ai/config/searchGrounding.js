// src/ai/config/searchGrounding.js
// Google Search Grounding Configuration for Real-Time Information
// Enables Gemini to search the internet for up-to-date information

/**
 * Intent types that benefit from real-time search
 */
export const SEARCH_ENABLED_INTENTS = [
  'nutrition_inquiry',      // "How many calories in chicken tikka?"
  'plan_request',           // "Create a diet plan" (for latest nutrition data)
  'question_specific',      // "What should I eat?" (for seasonal/trending foods)
  'recipe_request',         // "How to cook paneer butter masala?"
  'restaurant_query',       // "Best restaurants near me"
  'supplement_inquiry',     // "Is whey protein safe?"
  'food_comparison',        // "Which is better: oats or quinoa?"
  'exercise_technique',     // "Proper form for deadlift"
  'trend_query',           // "What's trending in fitness?"
  'video_request'          // "Show me a video on how to do squats"
];

/**
 * Determine if search grounding should be enabled for this query
 * 
 * @param {Object} intent - Intent classification result
 * @param {string} message - User message
 * @returns {boolean} - True if search should be enabled
 */
export function shouldEnableSearch(intent, message) {
  // Check if intent type benefits from search
  if (SEARCH_ENABLED_INTENTS.includes(intent.intent)) {
    return true;
  }
  
  // Check for search-trigger keywords in message
  const searchKeywords = [
    'latest', 'current', 'trending', 'popular', 'best', 'top',
    'restaurant', 'near me', 'available', 'in season',
    'recipe', 'how to cook', 'how to make', 'prepare',
    'reviews', 'ratings', 'recommendations',
    'nutrition facts', 'calories in', 'macros for',
    'scientific', 'research', 'study', 'evidence',
    'video', 'youtube', 'watch', 'tutorial', 'demonstration'
  ];
  
  const messageLower = message.toLowerCase();
  const hasSearchKeyword = searchKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
  
  if (hasSearchKeyword) {
    return true;
  }
  
  // Check for food/restaurant/video specific queries
  const foodQueryPatterns = [
    /nutrition (facts|info|data|content) (for|of|in)/i,
    /calories in .+/i,
    /how many (calories|protein|carbs|fats)/i,
    /recipe for .+/i,
    /how to (cook|make|prepare) .+/i,
    /(restaurant|cafe|food place) (near|in|at)/i,
    /best .+ (restaurant|food|meal)/i,
    /where (to|can i) (eat|find|get) .+/i,
    /(show|find|recommend) .+ video/i,
    /video (for|on|about|of) .+/i,
    /(youtube|tutorial|demonstration) .+/i
  ];
  
  const matchesPattern = foodQueryPatterns.some(pattern => 
    pattern.test(message)
  );
  
  return matchesPattern;
}

/**
 * Get search grounding configuration
 * Returns the configuration object for Google Search grounding
 * 
 * @param {Object} options - { threshold, maxResults }
 * @returns {Object} - Search grounding config
 */
export function getSearchGroundingConfig(options = {}) {
  const {
    threshold = 0.7,        // Confidence threshold for using search results
    maxResults = 5          // Maximum search results to consider
  } = options;
  
  return {
    googleSearchRetrieval: {
      // Dynamic retrieval configuration
      dynamicRetrievalConfig: {
        mode: 'MODE_DYNAMIC',
        dynamicThreshold: threshold
      }
    }
  };
}

/**
 * Log search usage for monitoring
 * 
 * @param {string} userId - User ID
 * @param {Object} intent - Intent object
 * @param {boolean} searchEnabled - Whether search was enabled
 */
export function logSearchUsage(userId, intent, searchEnabled) {
  if (searchEnabled) {
    console.log('[SearchGrounding] ✅ Google Search ENABLED');
    console.log('[SearchGrounding]   - Intent:', intent.intent);
    console.log('[SearchGrounding]   - Confidence:', (intent.confidence * 100).toFixed(0) + '%');
    console.log('[SearchGrounding]   - User:', userId);
  } else {
    console.log('[SearchGrounding] ⚡ Search SKIPPED (not needed)');
  }
}

/**
 * Performance metrics for search grounding
 */
export const SEARCH_PERFORMANCE_ESTIMATES = {
  withoutSearch: {
    simple: '500-800ms',
    complex: '1500-2500ms'
  },
  withSearch: {
    simple: '800-1200ms',      // +300-400ms
    complex: '1800-3000ms'     // +300-500ms
  },
  averageOverhead: '300-400ms',
  cacheHitTime: '0ms'
};

/**
 * Get user-friendly explanation of search usage
 * 
 * @param {boolean} searchUsed - Whether search was used
 * @returns {string} - Explanation
 */
export function getSearchExplanation(searchUsed) {
  if (searchUsed) {
    return 'I searched the internet for the most up-to-date information to give you accurate, current data.';
  }
  return 'I used my knowledge and your profile to provide this information.';
}
