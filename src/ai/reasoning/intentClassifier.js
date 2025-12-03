// src/ai/reasoning/intentClassifier.js
// Intent Classification for Professional Conversational Flow
// Analyzes user messages to understand their true intent before processing

/**
 * Intent categories with confidence thresholds
 */
export const IntentCategory = {
  GREETING: 'greeting',
  QUESTION_GENERAL: 'question_general',
  QUESTION_SPECIFIC: 'question_specific',
  PLAN_REQUEST: 'plan_request',
  PLAN_MODIFICATION: 'plan_modification',
  PROGRESS_TRACKING: 'progress_tracking',
  NUTRITION_INQUIRY: 'nutrition_inquiry',
  WORKOUT_INQUIRY: 'workout_inquiry',
  HEALTH_METRICS: 'health_metrics',
  MOTIVATION: 'motivation',
  COMPLAINT: 'complaint',
  FEEDBACK: 'feedback',
  CLARIFICATION_NEEDED: 'clarification_needed',
  // New search-optimized intents
  RECIPE_REQUEST: 'recipe_request',
  RESTAURANT_QUERY: 'restaurant_query',
  FOOD_COMPARISON: 'food_comparison',
  SUPPLEMENT_INQUIRY: 'supplement_inquiry',
  EXERCISE_TECHNIQUE: 'exercise_technique',
  TREND_QUERY: 'trend_query',
  VIDEO_REQUEST: 'video_request'
};

/**
 * Intent patterns with keywords and context clues
 */
const intentPatterns = {
  [IntentCategory.GREETING]: {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'sup', 'yo', 'namaste'],
    patterns: [/^(hi|hello|hey|sup|yo)\b/i, /good (morning|afternoon|evening)/i],
    requiresData: false,
    confidence: 0.9
  },
  
  [IntentCategory.QUESTION_SPECIFIC]: {
    keywords: ['what should i eat', 'meal plan', 'diet plan', 'workout plan', 'exercise today', 'today\'s workout', 'breakfast', 'lunch', 'dinner', 'show me', 'what exercises', 'workout schedule'],
    patterns: [
      /what (should|can|do) i eat/i,
      /show (me |my )?(diet|meal|workout|exercise)/i,
      /what('s| is) (my |the |today('s)?)?( )?(diet|meal|workout|exercise)/i,
      /(today|tomorrow)('s)? (diet|meal|workout|exercise)/i
    ],
    requiresData: true,
    confidence: 0.85
  },
  
  [IntentCategory.PLAN_REQUEST]: {
    keywords: ['create', 'make', 'generate', 'new plan', 'build', 'design', 'want a plan', 'need a plan'],
    patterns: [
      /(create|make|generate|build|design) (a |an |my )?(diet|meal|workout|exercise) plan/i,
      /i (want|need) (a |an )?(new )?(diet|meal|workout|exercise) plan/i,
      /can you (create|make|build)/i
    ],
    requiresData: true,
    confidence: 0.9
  },
  
  [IntentCategory.PLAN_MODIFICATION]: {
    keywords: ['change', 'modify', 'update', 'adjust', 'replace', 'swap', 'substitute', 'remove', 'add'],
    patterns: [
      /(change|modify|update|adjust) (my |the )?(diet|meal|workout|exercise)/i,
      /(replace|swap|substitute) (this |the )?(meal|exercise|food)/i,
      /(add|remove) (from |to )?(my )?(diet|meal|workout)/i
    ],
    requiresData: true,
    confidence: 0.85
  },
  
  [IntentCategory.NUTRITION_INQUIRY]: {
    keywords: ['calories', 'protein', 'carbs', 'fats', 'macros', 'nutrition', 'nutritional info', 'how many calories'],
    patterns: [
      /how many (calories|carbs|protein|fats)/i,
      /(calories|protein|carbs|fats) in/i,
      /nutrition(al)? (info|facts|content)/i,
      /macros? (for|of|in)/i
    ],
    requiresData: true,
    confidence: 0.8
  },
  
  [IntentCategory.WORKOUT_INQUIRY]: {
    keywords: ['exercise', 'workout', 'training', 'sets', 'reps', 'how to do', 'proper form', 'technique'],
    patterns: [
      /how (to|do i) (do|perform) (this |the |a )?exercise/i,
      /(proper form|technique) for/i,
      /how many (sets|reps)/i,
      /(workout|training) (routine|schedule|plan)/i
    ],
    requiresData: false,
    confidence: 0.8
  },
  
  [IntentCategory.HEALTH_METRICS]: {
    keywords: ['bmi', 'bmr', 'tdee', 'calorie needs', 'maintenance calories', 'weight', 'height', 'body fat'],
    patterns: [
      /(calculate|what('s| is)) (my |the )?(bmi|bmr|tdee)/i,
      /how many calories (should|do) i (eat|need|consume)/i,
      /(my |current )?(weight|height|body fat)/i
    ],
    requiresData: true,
    confidence: 0.9
  },
  
  [IntentCategory.PROGRESS_TRACKING]: {
    keywords: ['progress', 'tracking', 'log', 'record', 'achieved', 'completed', 'finished'],
    patterns: [
      /(log|record|track) (my )?(workout|meal|progress)/i,
      /i (completed|finished|did) (my )?(workout|exercise)/i,
      /(show|view) (my )?progress/i
    ],
    requiresData: true,
    confidence: 0.8
  },
  
  [IntentCategory.MOTIVATION]: {
    keywords: ['motivated', 'motivation', 'inspire', 'encourage', 'giving up', 'tired', 'exhausted', 'can\'t do this'],
    patterns: [
      /i('m| am) (not )?(motivated|inspired)/i,
      /(give|gave) up/i,
      /i (can't|cannot) do this/i,
      /(tired|exhausted|burned out)/i
    ],
    requiresData: false,
    confidence: 0.85
  },
  
  [IntentCategory.COMPLAINT]: {
    keywords: ['not working', 'doesn\'t work', 'problem', 'issue', 'wrong', 'error', 'broken'],
    patterns: [
      /(not working|doesn't work|broken)/i,
      /there('s| is) (a |an )?(problem|issue|error)/i,
      /something('s| is) wrong/i
    ],
    requiresData: false,
    confidence: 0.8
  },
  
  [IntentCategory.QUESTION_GENERAL]: {
    keywords: ['why', 'how', 'what', 'when', 'where', 'who', 'which', 'can you explain', 'tell me about'],
    patterns: [
      /^(why|how|what|when|where|who|which) /i,
      /can you (explain|tell me)/i,
      /what (is|are|does)/i
    ],
    requiresData: false,
    confidence: 0.7
  },
  
  [IntentCategory.RECIPE_REQUEST]: {
    keywords: ['recipe', 'how to cook', 'how to make', 'how to prepare', 'cooking', 'preparation', 'give me the recipe', 'show me recipe'],
    patterns: [
      /recipe (for|of|to make)/i,
      /how to (cook|make|prepare) .+/i,
      /cooking (instructions|method|steps) for/i,
      /(make|cook|prepare) .+ at home/i,
      /(give|show|tell) me (the )?recipe/i,
      /recipe for .+/i,
      /^recipe of .+/i
    ],
    requiresData: true,
    confidence: 0.9
  },
  
  [IntentCategory.RESTAURANT_QUERY]: {
    keywords: ['restaurant', 'cafe', 'eatery', 'food place', 'dine', 'near me', 'delivery'],
    patterns: [
      /(restaurant|cafe|food place) (near|in|at)/i,
      /where (can i|to) (eat|find|get|order)/i,
      /best .+ restaurant/i,
      /(delivery|takeout|dine.?in) (options|places)/i
    ],
    requiresData: true,
    confidence: 0.9
  },
  
  [IntentCategory.FOOD_COMPARISON]: {
    keywords: ['better', 'vs', 'versus', 'compare', 'difference between', 'which is healthier'],
    patterns: [
      /(which|what)('s| is) (better|healthier|best)/i,
      /.+ (vs|versus) .+/i,
      /(compare|comparison) (between )?(.+ and .+)/i,
      /difference between .+ and .+/i
    ],
    requiresData: true,
    confidence: 0.8
  },
  
  [IntentCategory.SUPPLEMENT_INQUIRY]: {
    keywords: ['supplement', 'protein powder', 'whey', 'creatine', 'bcaa', 'vitamins', 'multivitamin', 'pre-workout'],
    patterns: [
      /(is|are) .+ (supplement|protein|creatine|bcaa) (safe|good|effective)/i,
      /(should i|can i) take .+ (supplement|protein)/i,
      /(benefits|side effects) of .+ (supplement|protein)/i,
      /best .+ (supplement|protein|vitamins)/i
    ],
    requiresData: true,
    confidence: 0.85
  },
  
  [IntentCategory.EXERCISE_TECHNIQUE]: {
    keywords: ['proper form', 'technique', 'how to do', 'correct way', 'performing', 'execute'],
    patterns: [
      /(proper form|correct (form|technique)) for/i,
      /how to (do|perform|execute) .+ (properly|correctly)/i,
      /(technique|form) (for|of) .+ exercise/i,
      /am i doing .+ (correctly|right)/i
    ],
    requiresData: true,
    confidence: 0.85
  },
  
  [IntentCategory.TREND_QUERY]: {
    keywords: ['trending', 'popular', 'latest', 'current', 'new', 'hot', 'viral', 'in fashion'],
    patterns: [
      /what('s| is) (trending|popular|hot|latest)/i,
      /(current|latest|new) (trends|fitness trends|diet trends)/i,
      /what are people (doing|eating|trying)/i,
      /popular .+ (workout|diet|food|exercise)/i
    ],
    requiresData: true,
    confidence: 0.8
  }
};

/**
 * Classify user intent with confidence scoring
 * 
 * @param {string} message - User message
 * @param {Object} context - User context (profile, plans, history)
 * @returns {Object} - { intent, confidence, requiresData, reasoning }
 */
export function classifyIntent(message, context = {}) {
  if (!message || typeof message !== 'string') {
    return {
      intent: IntentCategory.CLARIFICATION_NEEDED,
      confidence: 1.0,
      requiresData: false,
      reasoning: 'Empty or invalid message'
    };
  }
  
  const messageLower = message.toLowerCase().trim();
  
  // Short greeting check (1-3 words)
  if (messageLower.split(' ').length <= 3 && /^(hi|hello|hey|sup|yo|good morning|good afternoon|good evening|namaste)\b/i.test(messageLower)) {
    return {
      intent: IntentCategory.GREETING,
      confidence: 0.95,
      requiresData: false,
      reasoning: 'Short greeting detected'
    };
  }
  
  let bestMatch = null;
  let highestScore = 0;
  let matchedPatterns = [];
  
  // Score each intent category
  for (const [intentType, config] of Object.entries(intentPatterns)) {
    let score = 0;
    let matches = [];
    
    // Check keyword matches
    const keywordMatches = config.keywords.filter(keyword => 
      messageLower.includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      score += keywordMatches.length * 0.2;
      matches.push(...keywordMatches);
    }
    
    // Check pattern matches (stronger signal)
    const patternMatches = config.patterns.filter(pattern => 
      pattern.test(message)
    );
    
    if (patternMatches.length > 0) {
      score += patternMatches.length * 0.5;
      matches.push('pattern_match');
    }
    
    // Apply base confidence
    score *= config.confidence;
    
    // Context-aware boosting
    if (intentType === IntentCategory.NUTRITION_INQUIRY && context.hasDietPlan) {
      score *= 1.1;
    }
    if (intentType === IntentCategory.WORKOUT_INQUIRY && context.hasWorkoutPlan) {
      score *= 1.1;
    }
    
    // Track best match
    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        intent: intentType,
        confidence: Math.min(score, 1.0),
        requiresData: config.requiresData,
        matches
      };
      matchedPatterns = matches;
    }
  }
  
  // If no good match found, default to general question
  if (!bestMatch || highestScore < 0.3) {
    return {
      intent: IntentCategory.QUESTION_GENERAL,
      confidence: 0.5,
      requiresData: false,
      reasoning: 'No strong pattern match - treating as general question',
      matchedPatterns: []
    };
  }
  
  return {
    ...bestMatch,
    reasoning: `Matched patterns: ${matchedPatterns.join(', ')}`
  };
}

/**
 * Determine what data is needed based on intent
 * 
 * @param {string} intent - Classified intent
 * @param {string} message - User message
 * @returns {Object} - { needsProfile, needsDiet, needsWorkout, needsHistory, needsVectorSearch }
 */
export function determineDataRequirements(intent, message = '') {
  const messageLower = message.toLowerCase();
  
  const requirements = {
    needsProfile: false,
    needsDiet: false,
    needsWorkout: false,
    needsHistory: false,
    needsVectorSearch: false,
    priority: 'low' // low, medium, high
  };
  
  // Always need basic profile for personalization
  requirements.needsProfile = true;
  
  switch (intent) {
    case IntentCategory.GREETING:
      requirements.priority = 'low';
      break;
      
    case IntentCategory.QUESTION_SPECIFIC:
    case IntentCategory.NUTRITION_INQUIRY:
      requirements.needsDiet = true;
      requirements.needsHistory = true;
      requirements.priority = 'high';
      break;
      
    case IntentCategory.WORKOUT_INQUIRY:
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
 * Extract entities from user message (foods, exercises, numbers, etc.)
 * 
 * @param {string} message - User message
 * @returns {Object} - { foods, exercises, numbers, measurements }
 */
export function extractEntities(message) {
  const entities = {
    foods: [],
    exercises: [],
    numbers: [],
    measurements: [],
    timeReferences: []
  };
  
  // Extract numbers
  const numberMatches = message.match(/\b\d+(\.\d+)?\b/g);
  if (numberMatches) {
    entities.numbers = numberMatches.map(n => parseFloat(n));
  }
  
  // Extract measurements (kg, lbs, cm, etc.)
  const measurementMatches = message.match(/\b\d+(\.\d+)?\s*(kg|lbs?|pounds?|cm|feet|ft|inches?|in)\b/gi);
  if (measurementMatches) {
    entities.measurements = measurementMatches;
  }
  
  // Extract time references
  const timeMatches = message.match(/\b(today|tomorrow|yesterday|this week|next week|morning|afternoon|evening)\b/gi);
  if (timeMatches) {
    entities.timeReferences = timeMatches.map(t => t.toLowerCase());
  }
  
  // Common food keywords (basic extraction)
  const foodKeywords = ['chicken', 'rice', 'dal', 'roti', 'paneer', 'egg', 'fish', 'salad', 'oats', 'banana', 'apple', 'milk', 'yogurt', 'bread', 'pasta'];
  entities.foods = foodKeywords.filter(food => 
    message.toLowerCase().includes(food)
  );
  
  // Common exercise keywords (basic extraction)
  const exerciseKeywords = ['push-up', 'squat', 'plank', 'run', 'walk', 'bench press', 'deadlift', 'curl', 'pull-up', 'cardio'];
  entities.exercises = exerciseKeywords.filter(exercise => 
    message.toLowerCase().includes(exercise)
  );
  
  return entities;
}

/**
 * Get conversation context indicators
 * 
 * @param {Array} conversationHistory - Previous messages
 * @returns {Object} - { isFollowUp, previousIntent, contextLength }
 */
export function getConversationContext(conversationHistory = []) {
  const contextLength = conversationHistory.length;
  const isFollowUp = contextLength > 0;
  
  let previousIntent = null;
  
  // Try to infer previous intent from last user message
  if (isFollowUp && contextLength >= 2) {
    const lastUserMessage = conversationHistory
      .slice()
      .reverse()
      .find(msg => msg.role === 'user');
    
    if (lastUserMessage) {
      const classification = classifyIntent(lastUserMessage.content);
      previousIntent = classification.intent;
    }
  }
  
  return {
    isFollowUp,
    previousIntent,
    contextLength,
    hasHistory: contextLength > 2
  };
}

/**
 * Detect if user is asking for suggestions vs requesting action
 * Helps determine whether to call tools immediately or just provide advice
 * 
 * @param {string} message - User message
 * @returns {Object} - { isSuggestion, isAction, shouldCallTools }
 */
export function detectSuggestionVsAction(message) {
  const messageLower = message.toLowerCase().trim();
  
  // Suggestion keywords - user wants advice, not action
  const suggestionKeywords = [
    'suggest', 'recommend', 'advice', 'tips', 'ideas', 'thoughts',
    'what should i', 'what can i', 'should i', 'can you recommend',
    'any suggestions', 'any advice', 'any tips', 'what do you think',
    'help me choose', 'which is better', 'what\'s best', 'what would you'
  ];
  
  // Action keywords - user wants immediate action
  const actionKeywords = [
    'create', 'make', 'build', 'generate', 'update', 'modify', 'change',
    'show me', 'display', 'get', 'fetch', 'give me', 'calculate',
    'track', 'log', 'record', 'add to', 'save', 'set up'
  ];
  
  // Retrieval keywords - user wants to see existing data
  const retrievalKeywords = [
    'show me my', 'what is my', 'display my', 'get my', 'fetch my',
    'view my', 'see my', 'check my', 'what are my'
  ];
  
  const hasSuggestionKeyword = suggestionKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
  
  const hasActionKeyword = actionKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
  
  const hasRetrievalKeyword = retrievalKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
  
  // Determine classification
  const isSuggestion = hasSuggestionKeyword && !hasActionKeyword;
  const isAction = hasActionKeyword || hasRetrievalKeyword;
  const shouldCallTools = isAction && !isSuggestion;
  
  return {
    isSuggestion,
    isAction,
    shouldCallTools,
    reasoning: isSuggestion 
      ? 'User is asking for suggestions/advice - provide suggestions first, then ask if they want to implement'
      : isAction 
        ? 'User is requesting action or data retrieval - call tools immediately'
        : 'Conversational query - respond without tools'
  };
}

/**
 * Main intent analysis pipeline
 * Combines classification, data requirements, and entity extraction
 * 
 * @param {string} message - User message
 * @param {Object} context - Full context (profile, plans, history)
 * @returns {Object} - Complete intent analysis
 */
export function analyzeIntent(message, context = {}) {
  const startTime = Date.now();
  
  // Step 1: Classify intent
  const classification = classifyIntent(message, context);
  
  // Step 2: Determine data requirements
  const dataNeeds = determineDataRequirements(classification.intent, message);
  
  // Step 3: Extract entities
  const entities = extractEntities(message);
  
  // Step 4: Get conversation context
  const conversationContext = getConversationContext(context.conversationHistory);
  
  // Step 5: Detect suggestion vs action
  const suggestionVsAction = detectSuggestionVsAction(message);
  
  const analysisTime = Date.now() - startTime;
  
  console.log('\n[IntentClassifier] 🎯 Intent Analysis Complete');
  console.log('[IntentClassifier] Intent:', classification.intent);
  console.log('[IntentClassifier] Confidence:', classification.confidence.toFixed(2));
  console.log('[IntentClassifier] Requires Data:', classification.requiresData);
  console.log('[IntentClassifier] Priority:', dataNeeds.priority);
  console.log('[IntentClassifier] Suggestion vs Action:', suggestionVsAction.isSuggestion ? 'SUGGESTION' : suggestionVsAction.isAction ? 'ACTION' : 'CONVERSATIONAL');
  console.log('[IntentClassifier] Should Call Tools:', suggestionVsAction.shouldCallTools);
  console.log('[IntentClassifier] Analysis Time:', analysisTime, 'ms');
  
  return {
    ...classification,
    dataNeeds,
    entities,
    conversationContext,
    suggestionVsAction,
    analysisTime,
    timestamp: new Date().toISOString()
  };
}
