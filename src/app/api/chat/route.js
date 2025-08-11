// app/api/chat/route.js - Enhanced with User Context Retrieval and Vector Search
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { createChatMemory, getRecentChatHistory, addToHistory, formatChatHistoryForContext } from "@/lib/memory";
import { personalizedVectorSearch, hybridSearch, createPersonalizedKnowledgeBase } from "@/lib/vectorSearch";
import { getFitnessTools } from "@/lib/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Import the enhanced context retrieval system
import { getEnhancedUserContext } from "@/lib/contextRetrieval";

export async function POST(request) {
  try {
    const { message, plan, conversationHistory, profile, userId } = await request.json();

    // Validate required fields
    if (!message || !userId) {
      return NextResponse.json({
        success: false,
        error: "Message and userId are required"
      }, { status: 400 });
    }

    // Debug environment variables
    console.log("Environment check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json({
        success: false,
        error: "AI service configuration error. Please check environment variables."
      }, { status: 500 });
    }

    if (process.env.GEMINI_API_KEY.length < 10) {
      console.error("GEMINI_API_KEY appears to be invalid (too short)");
      return NextResponse.json({
        success: false,
        error: "Invalid API key format."
      }, { status: 500 });
    }

    // Initialize LangChain components
    let llm;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        throw new Error("GEMINI_API_KEY is not properly configured");
      }

      console.log("Attempting ChatGoogleGenerativeAI initialization...");

      try {
        llm = new ChatGoogleGenerativeAI({
          apiKey: apiKey.trim(),
          model: "gemini-1.5-flash",
          temperature: 0.8,
          maxOutputTokens: 1500,
        });
        console.log("✓ ChatGoogleGenerativeAI initialized with 'model' parameter");
      } catch (error1) {
        console.log("❌ 'model' parameter failed, trying 'modelName'...");
        
        try {
          llm = new ChatGoogleGenerativeAI({
            apiKey: apiKey.trim(),
            modelName: "gemini-1.5-flash",
            temperature: 0.8,
            maxOutputTokens: 1500,
          });
          console.log("✓ ChatGoogleGenerativeAI initialized with 'modelName' parameter");
        } catch (error2) {
          console.log("❌ gemini-1.5-flash failed, trying gemini-pro...");
          
          try {
            llm = new ChatGoogleGenerativeAI({
              apiKey: apiKey.trim(),
              modelName: "gemini-pro",
              temperature: 0.8,
            });
            console.log("✓ ChatGoogleGenerativeAI initialized with gemini-pro");
          } catch (error3) {
            console.log("❌ All model variations failed, trying minimal config...");
            
            try {
              llm = new ChatGoogleGenerativeAI({
                apiKey: apiKey.trim(),
              });
              console.log("✓ ChatGoogleGenerativeAI initialized with minimal config");
            } catch (error4) {
              console.log("❌ All ChatGoogleGenerativeAI approaches failed");
              console.error("All errors:", { 
                error1: error1.message, 
                error2: error2.message, 
                error3: error3.message,
                error4: error4.message 
              });
              throw new Error(`Failed to initialize ChatGoogleGenerativeAI after all attempts: ${error4.message}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error("Error initializing ChatGoogleGenerativeAI:", error);
      
      return NextResponse.json({
        success: false,
        error: "Failed to initialize AI model. This appears to be a LangChain configuration issue.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        suggestion: "Try: npm install @langchain/google-genai@0.2.15 or switch to Google's direct SDK"
      }, { status: 500 });
    }

    // Get available tools
    let tools;
    try {
      tools = getFitnessTools();
    } catch (error) {
      console.error("Error getting fitness tools:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to load fitness tools."
      }, { status: 500 });
    }

    // **ENHANCED: Retrieve comprehensive user context**
    console.log("🔍 Retrieving enhanced user context...");
    let userContext;
    try {
      userContext = await getEnhancedUserContext(userId, message, 2000);
      console.log("✅ Enhanced user context retrieved successfully");
      console.log(`📊 Context sections: ${userContext.contextSections || 'N/A'}, Length: ${userContext.totalLength || 'N/A'}`);
    } catch (error) {
      console.error("❌ Error retrieving enhanced user context:", error);
      userContext = {
        profile: "Error loading comprehensive profile",
        diet: "Error loading detailed diet plans", 
        workout: "Error loading detailed workout plans",
        progress: "Error loading progress tracking",
        combined: "Could not load comprehensive personalized context"
      };
    }

    // **NEW: Perform personalized vector search**
    console.log("🔍 Performing personalized vector search...");
    let vectorSearchResults = [];
    try {
      // Use hybrid search for better results
      vectorSearchResults = await hybridSearch(message, userId, 4);
      console.log(`✅ Vector search completed: ${vectorSearchResults.length} results found`);
      
      // Create personalized knowledge base if this is a new user interaction
      if (vectorSearchResults.length === 0) {
        console.log("🧠 Creating personalized knowledge base...");
        await createPersonalizedKnowledgeBase(userId);
        // Retry search after creating personalized content
        vectorSearchResults = await personalizedVectorSearch(message, userId, 3);
      }
    } catch (error) {
      console.error("❌ Error in personalized vector search:", error);
      // Continue without vector search if there's an error
    }

    // Enhanced system prompts with memory and tool awareness
    const systemPrompts = {
      general: `You are Alex, a friendly and enthusiastic personal fitness coach with 10+ years of experience. You're like a supportive friend who happens to be a fitness expert.

Your personality:
- Warm, encouraging, and genuinely excited about helping people reach their goals
- Use casual, conversational language while maintaining professionalism
- Remember details from previous conversations and reference them naturally
- Ask follow-up questions to understand the person better
- Share relevant personal anecdotes or experiences when appropriate
- Use emojis occasionally to add warmth (but not excessively)
- Be empathetic to struggles and celebrate victories, no matter how small

Your expertise covers:
- Personalized workout plans and form corrections
- Nutrition advice and meal planning
- Motivation and habit building
- Injury prevention and recovery
- Mental health and fitness relationship

Available tools you can use:
- nutrition_lookup: Look up nutritional information for foods
- update_workout_plan: Create or update workout plans in the database
- calculate_health_metrics: Calculate BMI, BMR, and calorie needs
- track_progress: Record user's fitness progress

Always:
- Address the person by name when you know it
- Remember their goals, preferences, and previous conversations
- Provide actionable, specific advice
- Explain the "why" behind your recommendations
- Use tools when you need specific data or want to save information
- Adjust your communication style to match their energy level
- Be encouraging but realistic about timelines and expectations`,

      badminton: `You are Coach Maya, a former professional badminton player turned personal coach. You're passionate about the sport and love sharing your knowledge with players of all levels.

Your background:
- Played professionally for 8 years, now coaching for 6 years
- Specialize in technique refinement, mental game, and match strategy
- Known for breaking down complex movements into simple steps
- Experienced with players from beginners to advanced competitors

Your coaching style:
- Patient and detailed when explaining techniques
- Share insights from your playing days when relevant
- Focus on both physical and mental aspects of the game
- Adapt training based on player's current level and goals
- Use analogies and visual descriptions to explain movements
- Encourage consistent practice over perfection

Available tools:
- nutrition_lookup: Help with sports nutrition
- update_workout_plan: Create badminton-specific training plans
- calculate_health_metrics: Assess fitness for badminton performance
- track_progress: Monitor improvement in skills and fitness

Remember to:
- Ask about their current playing level and specific challenges
- Provide drills that match their skill level
- Discuss both technique and strategy
- Consider their physical fitness level for conditioning advice
- Share motivation and mental game tips from your experience`,

      "weight-loss": `You are Dr. Sarah (call me Sarah!), a certified nutritionist and wellness coach who specializes in sustainable weight management. You believe in creating lasting lifestyle changes rather than quick fixes.

Your philosophy:
- Weight loss is a journey, not a destination
- Focus on health and how they feel, not just the scale
- Small, consistent changes lead to big results
- Every person's body is different - no one-size-fits-all approach
- Mental health and self-compassion are crucial for success

Your approach:
- Ask about their relationship with food and exercise
- Understand their lifestyle, schedule, and preferences
- Provide realistic, sustainable strategies
- Address emotional eating and stress management
- Celebrate non-scale victories (energy, sleep, mood, etc.)
- Help them build healthy habits gradually

Available tools:
- nutrition_lookup: Provide accurate calorie and macro information
- calculate_health_metrics: Determine healthy calorie targets
- track_progress: Monitor weight loss and other metrics
- update_workout_plan: Create weight-loss focused exercise plans

Always:
- Be compassionate about their struggles
- Avoid restrictive language or shame
- Focus on addition (adding healthy foods) rather than elimination
- Use tools to provide accurate nutritional data
- Encourage them to listen to their body
- Remind them that setbacks are normal and part of the process`,

      "muscle-gain": `You are Coach Mike, a certified strength and conditioning specialist with a passion for helping people build muscle and strength safely and effectively.

Your expertise:
- 12 years of experience in strength training and bodybuilding
- Certified in sports nutrition and exercise physiology
- Worked with everyone from beginners to competitive athletes
- Known for creating efficient, results-driven programs

Your training philosophy:
- Progressive overload is key, but form comes first
- Consistency beats perfection every time
- Recovery is when the magic happens
- Nutrition fuels performance and growth
- Mental game is just as important as physical training

Available tools:
- calculate_health_metrics: Determine calorie surplus needs
- nutrition_lookup: Help optimize protein and macro intake
- update_workout_plan: Create and modify strength training programs
- track_progress: Monitor strength gains and muscle growth

Your personality:
- Encouraging and motivational without being pushy
- Geek out about the science behind muscle building
- Share practical tips from years of experience
- Help them understand their body's signals
- Use tools to provide data-driven recommendations
- Build confidence in the gym environment

Focus on:
- Creating progressive workout plans using the update_workout_plan tool
- Optimizing nutrition for muscle growth with accurate data
- Managing recovery and preventing burnout
- Building sustainable habits for long-term success`
    };

    let systemPrompt = systemPrompts[plan] || systemPrompts.general;

    // Enhanced personalization with profile context
    let personalContext = '';
    if (profile && profile.name) {
      personalContext += `\nUser's name: ${profile.name}`;
    }

    // Add comprehensive profile context for better personalization
    if (profile) {
      const profileInfo = [];
      if (profile.age) profileInfo.push(`Age: ${profile.age}`);
      if (profile.gender) profileInfo.push(`Gender: ${profile.gender}`);
      if (profile.location) profileInfo.push(`Location: ${profile.location}`);
      if (profile.fitnessGoal) profileInfo.push(`Primary Goal: ${profile.fitnessGoal}`);
      if (profile.experience) profileInfo.push(`Experience Level: ${profile.experience}`);
      if (profile.height) profileInfo.push(`Height: ${profile.height}`);
      if (profile.weight) profileInfo.push(`Current Weight: ${profile.weight}`);
      if (profile.targetWeight) profileInfo.push(`Target Weight: ${profile.targetWeight}`);
      if (profile.dietaryPreference) profileInfo.push(`Dietary Preference: ${profile.dietaryPreference}`);
      if (profile.bio) profileInfo.push(`Additional Info: ${profile.bio}`);
      
      if (profileInfo.length > 0) {
        personalContext += `\nUser Profile:\n${profileInfo.join('\n')}`;
      }
    }

    // Get persistent chat history from MongoDB with error handling
    let chatHistoryContext = '';
    try {
      const recentHistory = await getRecentChatHistory(userId, 5); // Last 5 exchanges
      chatHistoryContext = formatChatHistoryForContext(recentHistory, 800);
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Continue without history if there's an error
    }

    // **ENHANCED: Format vector search results for context**
    let vectorContext = '';
    try {
      vectorContext = formatVectorResultsForContext(vectorSearchResults, 800);
    } catch (error) {
      console.error("Error formatting vector search results:", error);
    }

    // **ENHANCED: Combine all context with intelligent prioritization**
    const fullSystemPrompt = `${systemPrompt}${personalContext}

${userContext.combined || ''}

${chatHistoryContext}

${vectorContext}

Current conversation context: The user is asking about fitness/health and you should provide helpful, personalized advice based on their comprehensive context shown above. This includes their current diet plans, workout plans, progress tracking, and personalized knowledge base.

CRITICAL INSTRUCTIONS:
1. Always reference the user's specific context when relevant - their current plans, goals, progress, and preferences
2. Make your advice truly personalized based on their actual data from diet plans, workout plans, and progress tracking
3. Use the vector search knowledge base to provide evidence-based recommendations
4. Use tools when you need specific data or want to save/update information for the user
5. If their current plans need modification based on their question, suggest using the update tools
6. Reference their recent progress and activities to keep them motivated
7. Acknowledge their equipment availability and dietary preferences in recommendations

Remember: You have access to their complete fitness journey context - use it to provide personalized, actionable advice!`;

    // Create prompt template for tool-calling agent
    let prompt;
    try {
      prompt = ChatPromptTemplate.fromMessages([
        ["system", fullSystemPrompt],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
      ]);
    } catch (error) {
      console.error("Error creating prompt template:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to create conversation template."
      }, { status: 500 });
    }

    // Create tool-calling agent with error handling
    let agent;
    try {
      agent = await createToolCallingAgent({
        llm,
        tools,
        prompt,
      });
    } catch (error) {
      console.error("Error creating tool-calling agent:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to initialize AI agent."
      }, { status: 500 });
    }

    // Create agent executor
    let agentExecutor;
    try {
      agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: process.env.NODE_ENV === 'development',
        maxIterations: 3,
      });
    } catch (error) {
      console.error("Error creating agent executor:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to initialize AI executor."
      }, { status: 500 });
    }

    // Prepare messages for the agent
    const chatHistory = [];
    
    // Add recent conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Take last 6 messages to avoid token limits
      const recentMessages = conversationHistory.slice(-6);
      for (const msg of recentMessages) {
        try {
          if (msg.role === 'user' && msg.content) {
            chatHistory.push(new HumanMessage(msg.content));
          } else if (msg.role === 'ai' && msg.content) {
            chatHistory.push(new AIMessage(msg.content));
          }
        } catch (error) {
          console.error("Error processing chat history message:", error);
          // Skip this message and continue
        }
      }
    }

    // Execute the agent with the user's message
    let result;
    try {
      console.log("🤖 Executing agent with comprehensive context...");
      result = await agentExecutor.invoke({
        input: message,
        chat_history: chatHistory,
      });
    } catch (error) {
      console.error("Error executing agent:", error);
      
      // If agent execution fails, try a simple LLM call as fallback
      try {
        console.log("Attempting fallback: direct LLM call...");
        const fallbackResponse = await llm.invoke([
          new SystemMessage(fullSystemPrompt),
          new HumanMessage(message)
        ]);
        
        result = { output: fallbackResponse.content };
        console.log("Fallback successful");
        
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        
        // Handle specific Gemini API errors
        if (error.message?.includes("API key") || fallbackError.message?.includes("API key")) {
          return NextResponse.json({
            success: false,
            error: "Invalid API key. Please check your Gemini API configuration."
          }, { status: 401 });
        } else if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
          return NextResponse.json({
            success: false,
            error: "API quota exceeded. Please try again later."
          }, { status: 429 });
        } else if (error.message?.includes("safety")) {
          return NextResponse.json({
            success: false,
            error: "Content blocked by safety filters. Please rephrase your message."
          }, { status: 400 });
        } else {
          return NextResponse.json({
            success: false,
            error: "AI processing error. Please try again.",
            details: process.env.NODE_ENV === 'development' ? (error.message + " | " + fallbackError.message) : undefined
          }, { status: 500 });
        }
      }
    }

    // Extract the final response
    const aiResponse = result?.output || "I apologize, but I'm having trouble responding right now. Please try again.";

    // Save conversation to persistent memory with error handling
    try {
      await addToHistory(userId, [
        { role: 'user', content: message },
        { role: 'ai', content: aiResponse }
      ]);
    } catch (error) {
      console.error("Error saving to chat history:", error);
      // Continue even if saving fails - don't break the response
    }

    // **ENHANCED: Generate contextual suggestions based on comprehensive user data**
    const suggestions = generateComprehensiveSuggestions(aiResponse, plan, message, profile, userContext, vectorSearchResults);

    // **NEW: Return enhanced response data**
    const responseData = {
      success: true,
      response: aiResponse,
      suggestions: suggestions,
    };

    // Add comprehensive context info for development debugging
    if (process.env.NODE_ENV === 'development') {
      responseData.debug = {
        contextUsed: {
          profileLoaded: userContext.profile && !userContext.profile.includes("Error loading"),
          dietPlansFound: userContext.diet && !userContext.diet.includes("No active diet plans"),
          workoutPlansFound: userContext.workout && !userContext.workout.includes("No active workout plans"),
          progressTracking: userContext.progress && !userContext.progress.includes("Error loading"),
          vectorResultsCount: vectorSearchResults.length,
          contextTotalLength: userContext.totalLength || 0,
          contextSections: userContext.contextSections || 0
        },
        vectorSearch: {
          resultsFound: vectorSearchResults.length,
          topResultTitles: vectorSearchResults.slice(0, 3).map(r => r.metadata?.title || 'Unknown'),
          searchQuality: vectorSearchResults.filter(r => r.finalRelevanceScore > 0.7).length
        }
      };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Chat API Error:", error);
    
    // Handle specific LangChain/Gemini errors
    let errorMessage = "I'm having trouble connecting right now. Let me try again!";
    let statusCode = 500;
    
    if (error.message?.includes("API key") || error.message?.includes("GEMINI_API_KEY")) {
      errorMessage = "There's an issue with the AI service configuration. Please check your API key.";
      statusCode = 401;
    } else if (error.message?.includes("rate limit") || error.message?.includes("quota")) {
      errorMessage = "I'm getting too many requests right now. Please wait a moment and try again.";
      statusCode = 429;
    } else if (error.message?.includes("safety") || error.message?.includes("blocked")) {
      errorMessage = "I can't provide a response to that message. Please try rephrasing your question.";
      statusCode = 400;
    } else if (error.message?.includes("network") || error.message?.includes("timeout")) {
      errorMessage = "Network connection issue. Please try again.";
      statusCode = 503;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: statusCode });
  }
}

/**
 * Format vector search results for LLM context
 */
function formatVectorResultsForContext(results, maxLength = 800) {
  if (!results || results.length === 0) {
    return '';
  }

  let context = `\n🧠 === RELEVANT KNOWLEDGE BASE ===\n`;
  let remainingLength = maxLength - context.length;

  for (const result of results) {
    if (remainingLength <= 100) break; // Save space for closing

    let resultText = '';
    if (result.formattedContent) {
      resultText = result.formattedContent;
    } else {
      resultText = `\n📚 ${result.metadata?.title || 'Knowledge'}\n${result.content}`;
      if (result.finalRelevanceScore && result.finalRelevanceScore > 0.7) {
        resultText += ` ⭐ (Highly Relevant)`;
      }
    }

    if (resultText.length <= remainingLength) {
      context += resultText + '\n';
      remainingLength -= resultText.length + 1;
    } else {
      // Truncate but keep essential info
      const truncated = resultText.substring(0, remainingLength - 50) + '...\n';
      context += truncated;
      break;
    }
  }

  context += `=== END KNOWLEDGE BASE ===\n`;
  return context;
}

/**
 * Enhanced suggestion generation with comprehensive user context awareness
 */
function generateComprehensiveSuggestions(response, plan, userMessage, profile, userContext, vectorResults) {
  const suggestions = [];
  
  // Validate inputs
  if (!response || typeof response !== 'string') {
    return getDefaultSuggestions(plan);
  }

  // Analyze the response content and comprehensive user context
  const responseLower = response.toLowerCase();
  const messageLower = (userMessage || '').toLowerCase();
  
  // Check user's actual context
  const hasActiveDiet = userContext?.diet && !userContext.diet.includes("No active diet plans") && !userContext.diet.includes("Error loading");
  const hasActiveWorkout = userContext?.workout && !userContext.workout.includes("No active workout plans") && !userContext.workout.includes("Error loading");
  const hasProgressData = userContext?.progress && !userContext.progress.includes("Error loading progress");
  const hasVectorResults = vectorResults && vectorResults.length > 0;

  // Context-aware suggestions based on user's actual comprehensive data
  if (hasActiveDiet && (responseLower.includes('meal') || responseLower.includes('diet') || responseLower.includes('nutrition'))) {
    suggestions.push("Show me today's detailed meal plan");
    if (userContext.diet.includes('calories') || userContext.diet.includes('protein')) {
      suggestions.push("Track my current nutrition progress");
    }
  }

  if (hasActiveWorkout && (responseLower.includes('workout') || responseLower.includes('exercise') || responseLower.includes('training'))) {
    suggestions.push("Show my current workout schedule");
    if (userContext.workout.includes('Week') || userContext.workout.includes('week')) {
      suggestions.push("Update my workout intensity");
    }
  }

  if (hasProgressData && (responseLower.includes('progress') || responseLower.includes('track'))) {
    suggestions.push("View my detailed progress report");
    if (userContext.progress.includes('weight') || userContext.progress.includes('Weight')) {
      suggestions.push("Log my latest measurements");
    }
  }

  // Vector search result-based suggestions
  if (hasVectorResults && suggestions.length < 3) {
    const topResult = vectorResults[0];
    if (topResult?.metadata?.type === 'workout' && !suggestions.some(s => s.includes('workout'))) {
      suggestions.push("Create a workout based on this knowledge");
    } else if (topResult?.metadata?.type === 'nutrition' && !suggestions.some(s => s.includes('nutrition'))) {
      suggestions.push("Get personalized nutrition advice");
    }
  }

  // Profile-aware intelligent suggestions
  if (profile?.fitnessGoal && suggestions.length < 3) {
    if (profile.fitnessGoal.includes('Weight Loss')) {
      if (!suggestions.some(s => s.includes('calorie'))) {
        suggestions.push("Calculate my weight loss calories");
      }
      if (hasActiveDiet && !suggestions.some(s => s.includes('deficit'))) {
        suggestions.push("Check my calorie deficit progress");
      }
    } else if (profile.fitnessGoal.includes('Muscle Gain')) {
      if (!suggestions.some(s => s.includes('protein'))) {
        suggestions.push("Check my daily protein targets");
      }
      if (hasActiveWorkout && !suggestions.some(s => s.includes('strength'))) {
        suggestions.push("Track my strength improvements");
      }
    } else if (profile.fitnessGoal.includes('badminton')) {
      if (!suggestions.some(s => s.includes('badminton'))) {
        suggestions.push("Show badminton-specific training");
      }
    }
  }

  // Plan-specific enhanced suggestions
  if (plan === 'badminton' && suggestions.length < 4) {
    if (responseLower.includes('drill') || responseLower.includes('practice')) {
      suggestions.push("Create personalized drill routine");
    }
    if (responseLower.includes('technique') || responseLower.includes('form')) {
      suggestions.push("Analyze my technique improvement");
    }
    if (!suggestions.some(s => s.includes('footwork'))) {
      suggestions.push("Focus on footwork drills");
    }
  } else if (plan === 'weight-loss' && suggestions.length < 4) {
    if (responseLower.includes('meal') || responseLower.includes('food')) {
      suggestions.push("Look up calories for specific foods");
    }
    if (responseLower.includes('plateau') || responseLower.includes('stuck')) {
      suggestions.push("Break through weight loss plateau");
    }
    if (!suggestions.some(s => s.includes('deficit'))) {
      suggestions.push("Adjust my calorie deficit");
    }
  } else if (plan === 'muscle-gain' && suggestions.length < 4) {
    if (responseLower.includes('protein') || responseLower.includes('nutrition')) {
      suggestions.push("Optimize my muscle building nutrition");
    }
    if (responseLower.includes('plateau') || responseLower.includes('stuck')) {
      suggestions.push("Overcome strength plateau");
    }
    if (!suggestions.some(s => s.includes('progressive'))) {
      suggestions.push("Plan progressive overload strategy");
    }
  }

  // Universal context-aware suggestions with comprehensive data awareness
  if (responseLower.includes('tool') || responseLower.includes('calculate')) {
    if (!suggestions.some(s => s.includes('metrics'))) {
      suggestions.push("Calculate updated health metrics");
    }
  }

  if (responseLower.includes('plan') || responseLower.includes('routine')) {
    if (!hasActiveDiet && !suggestions.some(s => s.includes('diet'))) {
      suggestions.push("Create comprehensive diet plan");
    }
    if (!hasActiveWorkout && !suggestions.some(s => s.includes('workout'))) {
      suggestions.push("Design detailed workout routine");
    }
  }

  // Fill remaining slots with intelligent contextual suggestions
  const contextualSuggestions = [
    hasActiveDiet ? "Review and modify my diet plan" : "Create personalized diet plan",
    hasActiveWorkout ? "Analyze my workout performance" : "Design custom workout routine", 
    hasProgressData ? "View comprehensive progress analysis" : "Start tracking my progress",
    profile?.fitnessGoal ? `Accelerate my ${profile.fitnessGoal} results` : "Define clear fitness goals",
    "Get evidence-based fitness advice",
    hasVectorResults ? "Explore more personalized content" : "Build my knowledge base",
    "What should I prioritize this week?",
    "Schedule my next milestone check-in"
  ];

  // Add contextual suggestions to fill remaining slots
  for (const suggestion of contextualSuggestions) {
    if (suggestions.length >= 4) break;
    if (!suggestions.includes(suggestion) && !suggestions.some(s => 
      s.toLowerCase().includes(suggestion.split(' ')[0].toLowerCase()) || 
      suggestion.toLowerCase().includes(s.split(' ')[0].toLowerCase())
    )) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 4); // Return max 4 suggestions
}

/**
 * Get default suggestions when response analysis fails
 */
function getDefaultSuggestions(plan) {
  const defaultSuggestions = {
    'badminton': [
      "Show me basic badminton drills",
      "How do I improve my footwork?", 
      "Help with my serve technique",
      "Create a training routine"
    ],
    'weight-loss': [
      "Calculate my daily calorie needs",
      "Create a weight loss meal plan",
      "What exercises burn the most calories?",
      "Track my weight progress"
    ],
    'muscle-gain': [
      "Calculate my bulking calories",
      "Create a muscle building workout",
      "How much protein do I need?",
      "Track my strength progress"
    ],
    'general': [
      "Help me set fitness goals",
      "Create a workout plan", 
      "Calculate my health metrics",
      "What should I focus on first?"
    ]
  };
  
  return defaultSuggestions[plan] || defaultSuggestions.general;
}

/**
 * LEGACY FUNCTION: Search fitness content using traditional methods
 * Kept for backward compatibility but enhanced with error handling
 */
async function searchFitnessContent(query, limit = 3) {
  try {
    // This would typically search a knowledge base
    // For now, return empty array to avoid errors
    console.log("Legacy fitness content search called - consider migrating to vector search");
    return [];
  } catch (error) {
    console.error("Error in legacy fitness content search:", error);
    return [];
  }
}

/**
 * Format search results for context (legacy compatibility)
 */
function formatSearchResultsForContext(results, maxLength = 500) {
  if (!results || results.length === 0) return '';
  
  let context = '\n=== FITNESS KNOWLEDGE ===\n';
  let remainingLength = maxLength - context.length;
  
  for (const result of results) {
    if (remainingLength <= 50) break;
    
    const resultText = `${result.title || 'Fitness Tip'}: ${result.content || result.summary || ''}\n`;
    if (resultText.length <= remainingLength) {
      context += resultText;
      remainingLength -= resultText.length;
    }
  }
  
  return context;
}