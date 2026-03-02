// src/ai/prompts/dynamicPromptBuilder.js
// Dynamic System Prompt Builder - Reduces token usage by 40-60%
// Only includes relevant sections based on user intent and context

/**
 * Core sections of the system prompt (modular components)
 */
const PROMPT_SECTIONS = {
  CORE_IDENTITY: (userContext, userId) => `You are Coachlix AI, an expert fitness AI assistant with advanced reasoning capabilities AND real-time internet search access. You think before you respond depending on User detials like Name,Age,Gender,Location to validate your advice, and provide professional, evidence-based guidance.

USER ID: ${userId}`,

  USER_PROFILE: (userContext) => {
    if (!userContext.profile) return '';
    
    const profile = userContext.profile;
    let section = '\n\n👤 USER PROFILE:';
    
    if (profile.name) section += `\n- Name: ${profile.name}`;
    if (profile.age) section += `\n- Age: ${profile.age}`;
    if (profile.fitnessGoal) section += `\n- Goal: ${profile.fitnessGoal}`;
    if (profile.fitnessLevel) section += `\n- Fitness Level: ${profile.fitnessLevel}`;
    if (profile.location) section += `\n- Location: ${profile.location}`;
    
    return section;
  },

  DIETARY_PREFERENCES: (userContext) => {
    const dietaryPref = userContext.profile?.dietaryPreference;
    if (!dietaryPref) return '';
    
    return `\n\n🥗 DIETARY PREFERENCE: ${dietaryPref}
   - Always suggest ${dietaryPref} meals and foods
   - Respect this preference in all nutrition advice`;
  },

  CULTURAL_CONTEXT: (userContext) => {
    const location = userContext.profile?.location;
    if (!location) return '';
    
    const isIndian = isIndianUser(location);
    
    if (isIndian) {
      return `\n\n🍛 CULTURAL CONTEXT: Indian Cuisine
- Suggest Indian meals: Roti/Chapati, Dal, Rice, Paneer, Sabzi, Idli, Dosa, Poha etc.
- Indian proteins: Paneer, Dal, Rajma, Chana, Eggs, Chicken, Fish etc.
- Use Indian cooking methods: Tadka, Curry, Tikka, Masala etc.
- Recommend Indian meal timing: Breakfast (7-9 AM), Lunch (12-2 PM), Snack (4-5 PM), Dinner (8-10 PM)
- Traditional combinations: Dal-Roti, Rice-Sambar, Idli-Sambar.
- Use user Internal capabilities to fetch local Indian recipes when needed. suggeset Youtube videos for Fitness and cooking with Indian context.`;
    } else {
      return `\n\n🌍 CULTURAL CONTEXT: International Cuisine
- Suggest Western/International meals: Sandwich, Salad, Pasta, Oatmeal, Chicken Breast, Quinoa Bowl
- International proteins: Chicken, Turkey, Beef, Fish, Salmon, Tuna, Eggs
- Use international cooking methods: Grilled, Baked, Steamed, Sautéed, Roasted
- Recommend standard meal timing: Breakfast (7-9 AM), Lunch (12-1 PM), Snack (3-4 PM), Dinner (6-8 PM)`;
    }
  },

  ACTIVE_PLANS: (userContext) => {
    let section = '';
    
    if (userContext.dietPlan) {
      section += `\n\n📋 ACTIVE DIET PLAN: ${userContext.dietPlan.planName || 'Custom Plan'}`;
      if (userContext.dietPlan.targetCalories) {
        section += `\n- Target: ${userContext.dietPlan.targetCalories} calories/day`;
      }
      if (userContext.dietPlan.mealsPerDay) {
        section += `\n- ${userContext.dietPlan.mealsPerDay} meals per day`;
      }
    }
    
    if (userContext.workoutPlan) {
      section += `\n\n💪 ACTIVE WORKOUT PLAN: ${userContext.workoutPlan.planName || 'Custom Plan'}`;
      if (userContext.workoutPlan.difficulty) {
        section += `\n- Difficulty: ${userContext.workoutPlan.difficulty}`;
      }
      if (userContext.workoutPlan.duration) {
        section += `\n- Duration: ${userContext.workoutPlan.duration} weeks`;
      }
    }
    
    return section;
  },

  REASONING_INSIGHTS: (reasoning) => {
    if (!reasoning || !reasoning.keyPoints || reasoning.keyPoints.length === 0) {
      return '';
    }
    
    let section = `\n\n🧠 KEY POINTS TO ADDRESS:`;
    reasoning.keyPoints.slice(0, 5).forEach((point, idx) => {
      section += `\n${idx + 1}. ${point}`;
    });
    
    if (reasoning.concerns && reasoning.concerns.length > 0) {
      section += `\n\n⚠️ IMPORTANT CONSIDERATIONS:`;
      reasoning.concerns.forEach(concern => {
        section += `\n- ${concern}`;
      });
    }
    
    return section;
  },

  RESPONSE_FRAMEWORK: () => `\n\n🎯 RESPONSE FRAMEWORK:

1. ACKNOWLEDGE & UNDERSTAND:
   - Show you understand their question/request
   - Reference relevant context from their profile or history
   - Use friendly emojis (👋 for greetings, 💪 for motivation)

2. PROVIDE EXPERT GUIDANCE:
   - Deliver accurate, evidence-based information
   - Explain the "why" behind your recommendations
   - Be culturally appropriate and respect dietary preferences
   - Add relevant emojis (🎯 for goals, 📊 for stats)

3. ACTIONABLE RECOMMENDATIONS:
   - Give clear, specific steps they can take
   - Prioritize what's most important
   - Make it practical and achievable
   - Use emojis for action items (✅ for steps, 💡 for tips)
   - suggest recipes and fitness exercise videos using Google Search capability when where needed.

4. ENCOURAGE & MOTIVATE:
   - End with encouragement
   - Reinforce their progress or potential
   - Use motivational emojis (🔥 🚀 💯 🌟)

5. QUICK SUMMARY FOR LONG RESPONSES:
   - If your response exceeds 300 words, add a "Quick Summary" section at the end
   - Use bullet points to highlight 3-5 key takeaways
   - Format: "📝 **Quick Summary:**\\n- [Key point 1]\\n- [Key point 2]..."`,

  COMMUNICATION_STYLE: () => `\n\n💬 COMMUNICATION STYLE:

✅ DO:
- **PROVIDE FULL RECIPES when requested** - You have Google Search for this purpose
- **PROVIDE YOUTUBE VIDEO LINKS when requested** - Share helpful tutorials
- **ADD QUICK SUMMARY for long responses (300+ words)**
- **USE EMOJIS to make responses engaging** - 💪🏋️‍♂️🏃‍♂️🍗🥗🍚✅🎯🔥💯
- **USE BULLET POINTS liberally** - Break down information with - or • symbols
- **USE NUMBERED LISTS for steps** - Use 1. 2. 3. format
- Be warm, professional, and encouraging
- Use simple language while being informative
- Personalize responses with their name and goals

❌ DON'T:
- **NEVER say "I can't provide recipes"** - You CAN using Google Search
- **NEVER say "I can't provide videos"** - You CAN suggest YouTube videos
- Overuse emojis (no more than 8-10 per response)
- Use technical jargon without explanation
- Be judgmental or harsh
- Give cookie-cutter generic advice`,

  TOOL_USAGE_RULES: () => `\n\n🔧 TOOL USAGE RULES:

**SUGGESTIONS vs ACTIONS:**
- **SUGGESTION requests** (suggest, recommend, advice, ideas) → DO NOT call tools, provide suggestions then ASK if they want to implement
- **ACTION requests** (create, update, show me my, fetch, get) → Call tools immediately

**Examples:**
❌ User: "Can you suggest a diet plan?" → DO NOT call create_diet_plan
✅ Correct: Provide suggestions, then ask "Would you like me to create this plan for you?"

✅ User: "Create a diet plan" → Call create_diet_plan immediately
✅ User: "Show me my meals" → Call fetch_details immediately

**TOOL CALLING GUIDELINES:**
- User asks for "recipe for [dish]" → RESPOND DIRECTLY (no tool calls) using Google Search
- User asks for "video for [topic]" → RESPOND DIRECTLY with YouTube links from Google Search
- User asks for "nutrition info for [food]" → RESPOND DIRECTLY using Google Search
- User asks "suggest/recommend meals" → Provide suggestions, then ASK to create plan
- User asks "show me my meals/workout" → MUST call: fetch_details ONCE
- User asks "create diet plan" → Call create_diet_plan with proper parameters
- User asks to **update/change/modify a day/meal/food item** in their diet plan → Follow this MANDATORY sequence:
  Step 1: Call fetch_details (type "diet") — the result contains a "Plan ID" line, copy it
  Step 2: For each new food item, call nutrition_lookup to get macros — NEVER ask the user for calorie/macro numbers
  Step 3: Call update_diet_plan with planId (from Step 1) + updateMeal / addFoodItem / removeFoodItem — NEVER omit planId
- User asks for "BMI" or "calculate calories" → MUST call: calculate_health_metrics ONCE`,

  GOOGLE_SEARCH_CAPABILITY: () => `\n\n🌐 GOOGLE SEARCH CAPABILITY:
- You have BUILT-IN real-time internet search through Google Search grounding
- This is NOT a tool you call - it works automatically in the background
- Use it for: RECIPES, restaurant info, nutrition facts, YouTube videos, latest fitness trends
- When user asks for a recipe, the search results are ALREADY available to you
- When user asks about restaurants, provide current options with ratings/reviews
- When user asks for videos, provide YouTube video links with titles and descriptions

**CRITICAL: Recipe & Video Requests - NO TOOL CALLS**
- When user asks "give me recipe for [dish]" → RESPOND DIRECTLY with the full recipe (NO tool calls)
- When user asks "show me video for [topic]" → RESPOND DIRECTLY with YouTube links (NO tool calls)
- DO NOT call any tools for recipes or videos
- Recipe format: Ingredients → Steps → Cooking time → Nutrition → Fitness tips
- Video format: Video title → YouTube link → Description → Why it's helpful`,

  SAFETY_FIRST: () => `\n\n⚠️ SAFETY FIRST:
- Never recommend extreme or dangerous practices
- Add disclaimers for medical concerns
- Suggest professional consultation when appropriate
- Use warning emojis when needed (⚠️ for cautions)`
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
 * Build optimized system prompt based on intent and user context
 * Only includes relevant sections, reducing token usage by 40-60%
 * 
 * @param {Object} intent - Intent classification result
 * @param {Object} userContext - User context from RAG
 * @param {string} userId - User ID
 * @param {Object} reasoning - Optional reasoning insights
 * @returns {string} - Optimized system prompt
 */
export function buildDynamicSystemPrompt(intent, userContext, userId, reasoning = null) {
  const sections = [];
  
  // ALWAYS include core identity
  sections.push(PROMPT_SECTIONS.CORE_IDENTITY(userContext, userId));
  sections.push(PROMPT_SECTIONS.CULTURAL_CONTEXT(userContext));
  
  // Include user profile if available
  if (userContext.profile) {
    sections.push(PROMPT_SECTIONS.USER_PROFILE(userContext));
  }
  
  // Include dietary preferences for nutrition-related intents
  if (intent.category === 'nutrition' || intent.category === 'diet_plan' || 
      userContext.profile?.dietaryPreference) {
    sections.push(PROMPT_SECTIONS.DIETARY_PREFERENCES(userContext));
  }
  
  // Include cultural context for nutrition-related intents
  if (intent.category === 'nutrition' || intent.category === 'diet_plan') {
    sections.push(PROMPT_SECTIONS.CULTURAL_CONTEXT(userContext));
  }
  
  // Include active plans if user has them (for plan-related queries)
  if (intent.category === 'diet_plan' || intent.category === 'workout_plan' ||
      userContext.dietPlan || userContext.workoutPlan) {
    sections.push(PROMPT_SECTIONS.ACTIVE_PLANS(userContext));
  }
  
  // Include reasoning insights if provided (for complex queries)
  if (reasoning && !reasoning.isFastPath) {
    sections.push(PROMPT_SECTIONS.REASONING_INSIGHTS(reasoning));
  }
  
  // ALWAYS include response framework (core to AI personality)
  sections.push(PROMPT_SECTIONS.RESPONSE_FRAMEWORK());
  
  // Include communication style for all intents
  sections.push(PROMPT_SECTIONS.COMMUNICATION_STYLE());
  
  // Include tool usage rules for action-oriented intents
  if (intent.category === 'diet_plan' || intent.category === 'workout_plan' || 
      intent.category === 'fitness_tracking' || intent.requiresData) {
    sections.push(PROMPT_SECTIONS.TOOL_USAGE_RULES());
  }
  
  // Include Google Search capability for nutrition and general queries
  if (intent.category === 'nutrition' || intent.category === 'general' || 
      intent.intent === 'recipe_request' || intent.intent === 'video_request') {
    sections.push(PROMPT_SECTIONS.GOOGLE_SEARCH_CAPABILITY());
  }
  
  // ALWAYS include safety guidelines
  sections.push(PROMPT_SECTIONS.SAFETY_FIRST());
  
  // Join all sections
  const prompt = sections.filter(s => s).join('');
  
  // Log token savings
  const estimatedTokens = Math.ceil(prompt.length / 4); // Rough estimate: 1 token ≈ 4 chars
  console.log(`[DynamicPrompt] Generated prompt: ${estimatedTokens} tokens (approx)`);
  console.log(`[DynamicPrompt] Sections included: ${sections.length}`);
  
  return prompt;
}

/**
 * Get a minimal system prompt for simple conversational intents
 * Uses ~60% fewer tokens than full prompt
 * 
 * @param {Object} userContext - User context
 * @param {string} userId - User ID
 * @returns {string} - Minimal system prompt
 */
export function buildMinimalSystemPrompt(userContext, userId) {
  return `You are Alex, a friendly fitness AI assistant.

USER ID: ${userId}
${userContext.profile ? `User: ${userContext.profile.name || 'User'}, Goal: ${userContext.profile.fitnessGoal || 'General fitness'}` : ''}

Be warm, encouraging, and helpful. Keep responses concise and personalized. Use emojis sparingly (1-2 max). If the user asks for recipes or videos, use your built-in Google Search to provide them directly.`;
}

/**
 * Determine which prompt builder to use based on intent
 * 
 * @param {Object} intent - Intent classification result
 * @returns {string} - 'full', 'dynamic', or 'minimal'
 */
export function selectPromptStrategy(intent) {
  // Use minimal prompt for simple conversational intents
  if (intent.category === 'general' && 
      ['greeting', 'chitchat', 'motivation'].includes(intent.intent) &&
      intent.confidence > 0.8) {
    return 'minimal';
  }
  
  // Use dynamic prompt for most intents (optimal token usage)
  if (intent.confidence > 0.6) {
    return 'dynamic';
  }
  
  // Use full prompt for complex or low-confidence intents (safety fallback)
  return 'full';
}

/**
 * Main entry point for generating system prompts
 * Automatically selects the best strategy
 * 
 * @param {Object} intent - Intent classification result
 * @param {Object} userContext - User context from RAG
 * @param {string} userId - User ID
 * @param {Object} reasoning - Optional reasoning insights
 * @returns {string} - Optimized system prompt
 */
export function generateOptimizedSystemPrompt(intent, userContext, userId, reasoning = null) {
  const strategy = selectPromptStrategy(intent);
  
  console.log(`[SystemPrompt] Strategy: ${strategy.toUpperCase()}`);
  
  switch (strategy) {
    case 'minimal':
      return buildMinimalSystemPrompt(userContext, userId);
    
    case 'dynamic':
      return buildDynamicSystemPrompt(intent, userContext, userId, reasoning);
    
    case 'full':
    default:
      // Fallback to existing full prompt
      const { generateProfessionalSystemPrompt } = require('./systemPrompts');
      return generateProfessionalSystemPrompt(userContext, userId, reasoning);
  }
}
