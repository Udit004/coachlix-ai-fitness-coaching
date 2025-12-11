// src/ai/reasoning/intent/patterns.js
// Comprehensive Intent Patterns with Enhanced Coverage
// Organized by category for easy maintenance and debugging

/**
 * Intent categories enum
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
  RECIPE_REQUEST: 'recipe_request',
  RESTAURANT_QUERY: 'restaurant_query',
  FOOD_COMPARISON: 'food_comparison',
  SUPPLEMENT_INQUIRY: 'supplement_inquiry',
  EXERCISE_TECHNIQUE: 'exercise_technique',
  TREND_QUERY: 'trend_query',
  VIDEO_REQUEST: 'video_request'
};

/**
 * Enhanced intent patterns with:
 * - More keyword variations (including typos, slang, abbreviations)
 * - Stronger regex patterns
 * - Negative patterns (what it's NOT)
 * - Context hints
 * - Priority weights
 */
export const intentPatterns = {
  [IntentCategory.GREETING]: {
    // High-confidence patterns
    exactMatches: [
      'hi', 'hello', 'hey', 'sup', 'yo', 'hola', 'namaste',
      'good morning', 'good afternoon', 'good evening', 'good night',
      'greetings', 'howdy', 'hii', 'hiii', 'heyyy', 'heyy'
    ],
    
    // Keyword variations (including common typos)
    keywords: [
      'hi', 'hello', 'hey', 'sup', 'yo', 'hola', 'namaste',
      'morning', 'afternoon', 'evening', 'night',
      'greetings', 'howdy', 'wassup', 'whatsup',
      // Common typos
      'helo', 'hii', 'heya', 'heyy', 'heyyy'
    ],
    
    // Regex patterns for more complex matching
    patterns: [
      /^(hi|hello|hey|sup|yo|hola|namaste|howdy)[\s!.]*$/i,
      /^good (morning|afternoon|evening|night)[\s!.]*$/i,
      /^(hi|hey|hello) (there|everyone|all|coach)[\s!.]*$/i,
      /^greetings[\s!.]*$/i
    ],
    
    // Negative patterns - if these match, it's NOT a greeting
    negativePatterns: [
      /\b(what|how|why|when|where|show|tell|give|can you)\b/i,
      /\?$/,  // Questions are not greetings
      /.{50,}/ // Long messages are not simple greetings
    ],
    
    // Context hints
    contextHints: {
      maxWords: 5,  // Greetings are typically short
      requiresStartOfMessage: true,
      allowedFollowUp: ['how are you', 'how r u', 'how do you do']
    },
    
    requiresData: false,
    confidence: 0.95,
    priority: 10  // Higher priority = checked first
  },
  
  [IntentCategory.NUTRITION_INQUIRY]: {
    keywords: [
      // Macros
      'calories', 'calorie', 'cals', 'kcal', 'protein', 'proteins', 'carbs', 'carb',
      'carbohydrates', 'fats', 'fat', 'macros', 'macro', 'fiber', 'fibre',
      // Nutrition terms
      'nutrition', 'nutritional', 'nutrients', 'nutrient', 'vitamins', 'minerals',
      'sodium', 'sugar', 'cholesterol', 'saturated fat',
      // Common queries
      'how many calories', 'calorie count', 'nutritional info', 'nutrition facts',
      'macro breakdown', 'macronutrients',
      // Typos
      'protien', 'protiens', 'calries', 'nutrtion'
    ],
    
    patterns: [
      // "How many X" patterns
      /how many (calories|cals|protein|carbs|fats?|macros?)/i,
      /how much (protein|carbs?|fat|fiber)/i,
      
      // "X in Y" patterns
      /(calories|protein|carbs?|fats?|macros?) (in|of|for)/i,
      
      // "Nutritional info" patterns
      /nutrition(al)? (info|facts|content|data|value|breakdown)/i,
      /macro(s|nutrients)? (for|of|in|breakdown)/i,
      
      // "Is X high in Y" patterns
      /is .+ (high|low|rich) in (protein|carbs?|calories|fat)/i,
      
      // Calorie counting
      /count(ing)? calories/i,
      /calorie count/i,
      /track(ing)? (calories|macros)/i,
      
      // Common food nutrition queries
      /\b\d+\s*(g|grams?|oz|ounces?) of .+ (calories|protein|carbs)/i
    ],
    
    negativePatterns: [
      /recipe/i,  // Recipe requests are different
      /how to (make|cook|prepare)/i,  // Cooking instructions
      /restaurant/i  // Restaurant queries
    ],
    
    contextHints: {
      foodMentioned: true,
      numberMentioned: true  // Often includes quantities
    },
    
    requiresData: true,
    confidence: 0.85,
    priority: 8
  },
  
  [IntentCategory.WORKOUT_INQUIRY]: {
    keywords: [
      // Exercise terms
      'exercise', 'exercises', 'workout', 'workouts', 'training', 'train',
      'gym', 'fitness', 'routine', 'program',
      // Sets and reps
      'sets', 'set', 'reps', 'rep', 'repetitions', 'repetition',
      // Form and technique
      'form', 'technique', 'proper form', 'correct form', 'how to do',
      'how to perform', 'execution',
      // Common exercises
      'push-up', 'pushup', 'squat', 'deadlift', 'bench press', 'plank',
      'pull-up', 'pullup', 'curl', 'lunge', 'burpee',
      // Workout types
      'cardio', 'strength', 'hiit', 'circuit', 'superset',
      // Typos
      'excercise', 'excersize', 'exersise', 'workot'
    ],
    
    patterns: [
      // "How to do" patterns
      /how (to|do i|can i) (do|perform|execute) (this |the |a )?exercise/i,
      /how (to|do i) (do|perform) (a |an )?(push.?up|squat|plank|deadlift|bench press)/i,
      
      // Form and technique
      /(proper|correct|right|good) (form|technique|way) (for|to|of)/i,
      /(form|technique) (for|of|to do) .+ exercise/i,
      /am i doing .+ (correctly|right|properly)/i,
      
      // Sets and reps
      /how many (sets|reps)/i,
      /\d+ (sets|reps) of/i,
      
      // Workout plans
      /(workout|training|exercise) (routine|schedule|plan|program)/i,
      /(show|give|tell) me (my |a |the )?(workout|exercise|training)/i,
      
      // Exercise modifications
      /(easier|harder|alternative|substitute) (for|to) .+ exercise/i,
      /can'?t do .+ (exercise|workout)/i,
      
      // Today's workout
      /(today'?s?|tomorrow'?s?) (workout|exercise|training)/i,
      /what (should|do) i (workout|exercise|train) today/i
    ],
    
    negativePatterns: [
      /calories in/i,  // Nutrition query
      /recipe/i,
      /\bhow many calories\b/i
    ],
    
    contextHints: {
      exerciseMentioned: true,
      actionOriented: true
    },
    
    requiresData: false,
    confidence: 0.85,
    priority: 8
  },
  
  [IntentCategory.PLAN_REQUEST]: {
    keywords: [
      // Action verbs
      'create', 'make', 'generate', 'build', 'design', 'develop',
      'need', 'want', 'looking for', 'give me', 'show me',
      // Plan types
      'plan', 'program', 'schedule', 'routine',
      'diet plan', 'meal plan', 'workout plan', 'exercise plan',
      'training plan', 'fitness plan',
      // New/custom
      'new', 'custom', 'personalized', 'customized',
      // Typos
      'creat', 'mak', 'generat'
    ],
    
    patterns: [
      // "Create/Make a plan" patterns
      /(create|make|generate|build|design|develop) (a |an |my )?(new )?(diet|meal|workout|exercise|training|fitness) plan/i,
      
      // "I want/need a plan" patterns
      /i (want|need|would like|am looking for) (a |an )?(new )?(diet|meal|workout|exercise|training|fitness) plan/i,
      
      // "Can you create" patterns
      /can you (create|make|build|generate|design) (a |an |my )?plan/i,
      
      // "Give me a plan" patterns
      /(give|show|send) me (a |an )?(new )?(diet|meal|workout|training) plan/i,
      
      // "Start a plan" patterns
      /(start|begin|initiate) (a |an |my )?(new )?(diet|meal|workout|fitness) (plan|program)/i,
      
      // "Help me with a plan" patterns
      /help me (create|make|build|with) (a |an |my )?(diet|workout|meal) plan/i,
      
      // Personalized requests
      /(personalized|customized|custom|tailored) (diet|meal|workout|fitness) plan/i
    ],
    
    negativePatterns: [
      /\b(change|modify|update|adjust|edit)\b/i,  // Modification, not creation
      /\b(show|view|see) (my |the )(current|existing)\b/i  // Viewing existing
    ],
    
    contextHints: {
      actionOriented: true,
      planMentioned: true,
      creationIntent: true
    },
    
    requiresData: true,
    confidence: 0.9,
    priority: 9
  },
  
  [IntentCategory.PLAN_MODIFICATION]: {
    keywords: [
      // Modification verbs
      'change', 'modify', 'update', 'adjust', 'edit', 'alter', 'revise',
      'replace', 'swap', 'substitute', 'switch', 'exchange',
      'remove', 'delete', 'take out', 'add', 'include', 'insert',
      // Targets
      'meal', 'food', 'exercise', 'workout', 'plan',
      // Reasons
      'don\'t like', 'hate', 'allergic', 'can\'t eat', 'can\'t do',
      // Typos
      'chang', 'modifi', 'updat'
    ],
    
    patterns: [
      // "Change/Modify" patterns
      /(change|modify|update|adjust|edit|alter) (my |the )?(diet|meal|workout|exercise|plan)/i,
      
      // "Replace/Swap" patterns
      /(replace|swap|substitute|switch|exchange) (this |the |my )?(meal|food|exercise|workout)/i,
      /(replace|swap|substitute) .+ with .+/i,
      
      // "Remove/Add" patterns
      /(remove|delete|take out|eliminate) .+ (from |in )?(my )?(diet|meal|workout|plan)/i,
      /(add|include|insert|put) .+ (to |in |into )?(my )?(diet|meal|workout|plan)/i,
      
      // "Don't like" patterns
      /(don'?t|do not|can'?t|cannot) (like|want|eat|do) (this |the |my )?/i,
      /i (hate|dislike) (this |the )?/i,
      
      // Allergy/restriction patterns
      /(allergic|intolerant) to/i,
      /can'?t (eat|have|consume|do)/i,
      
      // Alternative requests
      /(give|show|suggest) (me )?(an |a )?(alternative|substitute|replacement|option)/i,
      /what (can|could|should) i (eat|have|do) instead/i
    ],
    
    negativePatterns: [
      /\b(create|make|new)\b/i  // Creation, not modification
    ],
    
    contextHints: {
      modificationIntent: true,
      planMentioned: true,
      hasExistingPlan: true
    },
    
    requiresData: true,
    confidence: 0.88,
    priority: 9
  },
  
  [IntentCategory.QUESTION_SPECIFIC]: {
    keywords: [
      // Specific queries about user's own data (MUST have personal context)
      'my diet', 'my meal', 'my workout', 'my plan', 'my exercise',
      'my calories', 'my macros', 'my progress',
      // Today/tomorrow specific (implies user's plan)
      'today', 'tomorrow', 'this week', 'this month',
      'breakfast', 'lunch', 'dinner', 'snack',
      // Show/view commands (when referring to user's data)
      'show me my', 'tell me my', 'what is my', 'what are my',
      'display my', 'view my', 'see my', 'check my'
    ],
    
    patterns: [
      // "What should I eat" patterns (personal)
      /what (should|can|do) i eat/i,
      /what'?s (for |my )?(breakfast|lunch|dinner|snack)/i,
      
      // "Show me MY" patterns (MUST have "my" or personal context)
      /show (me )?(my )(diet|meal|workout|exercise|plan)/i,
      /(what'?s?|what is|what are) (my |today'?s?)( )?(diet|meal|workout|exercise)/i,
      
      // Today/tomorrow patterns (implies user's plan)
      /(today|tomorrow|tonight)'?s? (diet|meal|workout|exercise|plan)/i,
      /what (am i|should i) (eating|doing|having) (today|tomorrow)/i,
      
      // "Tell me about MY" patterns (MUST have "my")
      /tell me about (my )(diet|meal|workout|plan)/i,
      
      // "Check MY" patterns (MUST have "my")
      /(check|view|see|display) (my )(diet|meal|workout|progress)/i
    ],
    
    negativePatterns: [
      /\b(create|make|new)\b/i,
      /\b(change|modify|update)\b/i,
      /\bhow many calories in\b/i,  // General nutrition query
      // CRITICAL: Reject general knowledge questions
      /^(what|tell me|explain) (is|are|does) (?!my|mine|i|me)/i,  // "what is protein" → REJECT
      /^can you (tell|explain) (?!my|mine|i|me)/i,  // "can you tell me what is" → REJECT
      /\b(what is|what are) (protein|carbs|calories|fat|fiber|vitamins)\b/i  // General definitions
    ],
    
    contextHints: {
      personalDataQuery: true,
      specificTimeframe: true,
      mustHavePersonalPronouns: true  // NEW: Enforce personal context
    },
    
    requiresData: true,
    confidence: 0.85,
    priority: 8
  },
  
  [IntentCategory.RECIPE_REQUEST]: {
    keywords: [
      'recipe', 'recipes', 'how to cook', 'how to make', 'how to prepare',
      'cooking', 'cook', 'preparation', 'prepare', 'ingredients',
      'instructions', 'steps', 'method',
      // Typos
      'recip', 'recepie', 'recipie'
    ],
    
    patterns: [
      // "Recipe for" patterns
      /recipe (for|of|to make) .+/i,
      /(give|show|tell|send) me (the |a )?recipe/i,
      
      // "How to cook/make" patterns
      /how to (cook|make|prepare) .+/i,
      /how (do i|can i) (cook|make|prepare) .+/i,
      
      // "Cooking instructions" patterns
      /(cooking|preparation) (instructions|method|steps|process) (for|of)/i,
      
      // "Make at home" patterns
      /(make|cook|prepare) .+ at home/i,
      
      // "Recipe of" patterns
      /^recipe of .+/i,
      /^.+ recipe$/i
    ],
    
    negativePatterns: [
      /\bhow many calories\b/i,  // Nutrition query
      /\bnutrition(al)? (info|facts)\b/i
    ],
    
    contextHints: {
      foodMentioned: true,
      instructionsNeeded: true
    },
    
    requiresData: true,
    confidence: 0.9,
    priority: 8
  },
  
  [IntentCategory.HEALTH_METRICS]: {
    keywords: [
      // Metrics
      'bmi', 'bmr', 'tdee', 'body mass index', 'basal metabolic rate',
      'total daily energy expenditure',
      // Measurements
      'weight', 'height', 'body fat', 'body fat percentage', 'lean mass',
      'waist', 'chest', 'measurements',
      // Calculations
      'calculate', 'calculation', 'compute', 'what is my',
      'calorie needs', 'maintenance calories', 'daily calories'
    ],
    
    patterns: [
      // "Calculate my" patterns
      /(calculate|compute|what'?s?|what is) (my |the )?(bmi|bmr|tdee)/i,
      
      // "How many calories" patterns
      /how many calories (should|do) i (eat|need|consume|burn)/i,
      /(my |what'?s? my )?(daily )?(calorie|calories) (needs|requirement|intake)/i,
      
      // "Maintenance calories" patterns
      /(maintenance|daily) calories/i,
      
      // "My weight/height" patterns
      /(my |current |what'?s? my )(weight|height|bmi|body fat)/i,
      
      // Measurement tracking
      /track (my )?(weight|measurements|body fat)/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      calculationNeeded: true,
      personalMetrics: true
    },
    
    requiresData: true,
    confidence: 0.9,
    priority: 8
  },
  
  [IntentCategory.PROGRESS_TRACKING]: {
    keywords: [
      'progress', 'tracking', 'track', 'log', 'record', 'save',
      'achieved', 'completed', 'finished', 'done',
      'history', 'past', 'previous',
      'weight loss', 'gained', 'lost'
    ],
    
    patterns: [
      // "Log/Record" patterns
      /(log|record|track|save) (my )?(workout|meal|progress|weight)/i,
      
      // "I completed" patterns
      /i (completed|finished|did|done) (my )?(workout|exercise|meal)/i,
      
      // "Show progress" patterns
      /(show|view|see|check|display) (my )?progress/i,
      /how (am i|is my) (doing|progressing)/i,
      
      // Weight tracking
      /(lost|gained) .+ (pounds?|lbs?|kg|kilos?|weight)/i,
      /my weight (is|was|now)/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      trackingIntent: true,
      historicalData: true
    },
    
    requiresData: true,
    confidence: 0.85,
    priority: 7
  },
  
  [IntentCategory.MOTIVATION]: {
    keywords: [
      'motivated', 'motivation', 'inspire', 'inspiration', 'encourage',
      'giving up', 'give up', 'quit', 'quitting',
      'tired', 'exhausted', 'burned out', 'burnout',
      'can\'t do this', 'too hard', 'difficult',
      'demotivated', 'unmotivated', 'discouraged'
    ],
    
    patterns: [
      // "Not motivated" patterns
      /i'?m (not |no longer )?(motivated|inspired)/i,
      /(need|want) (some )?(motivation|inspiration|encouragement)/i,
      
      // "Giving up" patterns
      /(give|gave|giving) up/i,
      /want to (quit|stop|give up)/i,
      
      // "Can't do this" patterns
      /i (can'?t|cannot) do this/i,
      /(too|so) (hard|difficult|tough)/i,
      
      // "Tired/exhausted" patterns
      /i'?m (so |very |really )?(tired|exhausted|burned out)/i,
      /feeling (tired|exhausted|demotivated|discouraged)/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      emotionalSupport: true,
      encouragementNeeded: true
    },
    
    requiresData: false,
    confidence: 0.85,
    priority: 9
  },
  
  [IntentCategory.FOOD_COMPARISON]: {
    keywords: [
      'better', 'best', 'vs', 'versus', 'or',
      'compare', 'comparison', 'difference', 'different',
      'which', 'healthier', 'healthiest'
    ],
    
    patterns: [
      // "Which is better" patterns
      /(which|what)'?s? (better|healthier|best|worse)/i,
      
      // "X vs Y" patterns
      /.+ (vs|versus) .+/i,
      /.+ or .+\?/i,
      
      // "Compare" patterns
      /(compare|comparison) (between )?(.+ and .+)/i,
      
      // "Difference between" patterns
      /(difference|different) between .+ and .+/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      comparisonIntent: true,
      multipleItemsMentioned: true
    },
    
    requiresData: true,
    confidence: 0.85,
    priority: 7
  },
  
  [IntentCategory.SUPPLEMENT_INQUIRY]: {
    keywords: [
      'supplement', 'supplements', 'protein powder', 'whey', 'creatine', 'bcaa',
      'vitamins', 'vitamin', 'multivitamin', 'pre-workout', 'pre workout',
      'post-workout', 'post workout', 'amino acids', 'omega-3'
    ],
    
    patterns: [
      /(is|are) .+ (supplement|protein|creatine|bcaa) (safe|good|effective)/i,
      /(should i|can i) take .+ (supplement|protein)/i,
      /(benefits|side effects) of .+ (supplement|protein)/i,
      /best .+ (supplement|protein|vitamins)/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      supplementMentioned: true
    },
    
    requiresData: true,
    confidence: 0.85,
    priority: 7
  },
  
  [IntentCategory.EXERCISE_TECHNIQUE]: {
    keywords: [
      'proper form', 'correct form', 'technique', 'how to do', 'how to perform',
      'correct way', 'performing', 'execute', 'execution',
      'form check', 'am i doing', 'doing correctly'
    ],
    
    patterns: [
      /(proper form|correct (form|technique)) for/i,
      /how to (do|perform|execute) .+ (properly|correctly)/i,
      /(technique|form) (for|of) .+ exercise/i,
      /am i doing .+ (correctly|right)/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      exerciseMentioned: true,
      formFocus: true
    },
    
    requiresData: true,
    confidence: 0.85,
    priority: 8
  },
  
  [IntentCategory.TREND_QUERY]: {
    keywords: [
      'trending', 'popular', 'latest', 'current', 'new', 'hot', 'viral',
      'in fashion', 'trend', 'trends', 'what\'s new', 'what is new'
    ],
    
    patterns: [
      /what('s| is) (trending|popular|hot|latest)/i,
      /(current|latest|new) (trends|fitness trends|diet trends)/i,
      /what are people (doing|eating|trying)/i,
      /popular .+ (workout|diet|food|exercise)/i
    ],
    
    negativePatterns: [],
    
    contextHints: {
      trendFocus: true
    },
    
    requiresData: true,
    confidence: 0.8,
    priority: 6
  },
  
  [IntentCategory.QUESTION_GENERAL]: {
    keywords: [
      'why', 'how', 'what', 'when', 'where', 'who', 'which',
      'explain', 'tell me about', 'information about',
      'is it', 'does it', 'can i', 'should i',
      // General knowledge terms
      'what is', 'what are', 'tell me what', 'explain what'
    ],
    
    patterns: [
      // Question starters (general knowledge)
      /^(why|how|what|when|where|who|which) /i,
      
      // "What is X" patterns (general definitions)
      /^(what|tell me|explain|describe) (is|are) (?!my|mine)/i,  // "what is protein" → MATCH
      /^can you (tell|explain) (me )?(what|how|why)/i,  // "can you tell me what is" → MATCH
      
      // General knowledge questions
      /(what|tell me|explain) (is|are|does|about) (protein|carbs|calories|fat|fiber|vitamins|minerals|nutrients)/i,
      /(benefits|effects|importance) of/i,
      /how (does|do|can) .+ work/i,
      
      // General questions
      /\?$/  // Ends with question mark
    ],
    
    negativePatterns: [
      /\b(my|mine)\b/i,  // Personal queries are specific
      /\b(show|give|tell) me my\b/i,  // Personal data requests
      /\b(today|tomorrow)'?s?\b/i  // Time-specific (implies personal plan)
    ],
    
    contextHints: {
      generalKnowledge: true,
      notPersonal: true
    },
    
    requiresData: false,
    confidence: 0.80,  // Increased from 0.7
    priority: 7  // Increased from 3 to compete with other intents
  }
};

/**
 * Get pattern configuration for an intent
 */
export function getPatternConfig(intentType) {
  return intentPatterns[intentType] || null;
}

/**
 * Get all intent categories
 */
export function getAllIntentCategories() {
  return Object.values(IntentCategory);
}

/**
 * Get high-priority intents (checked first)
 */
export function getHighPriorityIntents() {
  return Object.entries(intentPatterns)
    .filter(([_, config]) => config.priority >= 8)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([intent, _]) => intent);
}
