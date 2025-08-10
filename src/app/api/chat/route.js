// app/api/chat/route.js - Enhanced LangChain Integration with Error Handling
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { createChatMemory, getRecentChatHistory, addToHistory, formatChatHistoryForContext } from "@/lib/memory";
import { searchFitnessContent, formatSearchResultsForContext } from "@/lib/vectorSearch";
import { getFitnessTools } from "@/lib/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

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
    console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
    console.log("GEMINI_API_KEY first 10 chars:", process.env.GEMINI_API_KEY?.substring(0, 10));

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

    // Initialize LangChain components with correct configuration for v0.2.16
    let llm;
    try {
      // Additional validation
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        throw new Error("GEMINI_API_KEY is not properly configured");
      }

      console.log("Attempting ChatGoogleGenerativeAI initialization...");

      // For @langchain/google-genai@0.2.16, use the correct model names and config
      try {
        llm = new ChatGoogleGenerativeAI({
          apiKey: apiKey.trim(),
          model: "gemini-1.5-flash", // Use 'model' instead of 'modelName' for newer versions
          temperature: 0.8,
          maxOutputTokens: 1500,
        });
        console.log("✓ ChatGoogleGenerativeAI initialized with 'model' parameter");
      } catch (error1) {
        console.log("❌ 'model' parameter failed, trying 'modelName'...");
        
        // Fallback to modelName parameter
        try {
          llm = new ChatGoogleGenerativeAI({
            apiKey: apiKey.trim(),
            modelName: "gemini-1.5-flash", // Remove '-latest' suffix
            temperature: 0.8,
            maxOutputTokens: 1500,
          });
          console.log("✓ ChatGoogleGenerativeAI initialized with 'modelName' parameter");
        } catch (error2) {
          console.log("❌ gemini-1.5-flash failed, trying gemini-pro...");
          
          // Try the stable gemini-pro model
          try {
            llm = new ChatGoogleGenerativeAI({
              apiKey: apiKey.trim(),
              modelName: "gemini-pro",
              temperature: 0.8,
            });
            console.log("✓ ChatGoogleGenerativeAI initialized with gemini-pro");
          } catch (error3) {
            console.log("❌ All model variations failed, trying minimal config...");
            
            // Try absolutely minimal configuration
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
      chatHistoryContext = formatChatHistoryForContext(recentHistory, 1500);
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Continue without history if there's an error
    }

    // Search for relevant fitness content using vector search with error handling
    let vectorSearchContext = '';
    try {
      const searchResults = await searchFitnessContent(message, 3);
      vectorSearchContext = formatSearchResultsForContext(searchResults, 1000);
    } catch (error) {
      console.error("Error performing vector search:", error);
      // Continue without vector search if there's an error
    }

    // Combine all context
    const fullSystemPrompt = `${systemPrompt}${personalContext}${chatHistoryContext}${vectorSearchContext}

Current conversation context: The user is asking about fitness/health and you should provide helpful, personalized advice. Use the available tools when you need specific data or want to save information for the user.`;

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
        verbose: process.env.NODE_ENV === 'development', // Enable verbose logging in development
        maxIterations: 3, // Limit iterations to prevent infinite loops
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

    // Generate contextual suggestions based on the response
    const suggestions = generateContextualSuggestions(aiResponse, plan, message, profile);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      suggestions: suggestions,
    });

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
 * Enhanced suggestion generation with better context awareness
 */
function generateContextualSuggestions(response, plan, userMessage, profile) {
  const suggestions = [];
  
  // Validate inputs
  if (!response || typeof response !== 'string') {
    return getDefaultSuggestions(plan);
  }
  
  // Analyze the response content for better suggestions
  const responseLower = response.toLowerCase();
  const messageLower = (userMessage || '').toLowerCase();
  
  // Plan-specific intelligent suggestions
  if (plan === 'badminton') {
    if (responseLower.includes('drill') || responseLower.includes('practice')) {
      suggestions.push("Show me more drills like this");
    }
    if (responseLower.includes('technique') || responseLower.includes('form')) {
      suggestions.push("How do I fix my form?");
    }
    if (responseLower.includes('footwork')) {
      suggestions.push("Footwork improvement tips");
    }
    if (responseLower.includes('serve') || responseLower.includes('smash')) {
      suggestions.push("Help me with my serve technique");
    }
  } else if (plan === 'weight-loss') {
    if (responseLower.includes('meal') || responseLower.includes('food')) {
      suggestions.push("Look up calories for [food name]");
    }
    if (responseLower.includes('calorie') || responseLower.includes('deficit')) {
      suggestions.push("Calculate my daily calorie needs");
    }
    if (responseLower.includes('exercise') || responseLower.includes('workout')) {
      suggestions.push("Create a weight loss workout plan");
    }
    if (responseLower.includes('progress') || responseLower.includes('track')) {
      suggestions.push("Track my weight progress");
    }
  } else if (plan === 'muscle-gain') {
    if (responseLower.includes('protein') || responseLower.includes('nutrition')) {
      suggestions.push("Look up protein in [food name]");
    }
    if (responseLower.includes('workout') || responseLower.includes('training')) {
      suggestions.push("Update my workout plan");
    }
    if (responseLower.includes('calorie') || responseLower.includes('surplus')) {
      suggestions.push("Calculate my bulking calories");
    }
    if (responseLower.includes('progress')) {
      suggestions.push("Track my strength progress");
    }
  } else if (plan === 'strength') {
    if (responseLower.includes('workout') || responseLower.includes('training')) {
      suggestions.push("Create my strength training plan");
    }
    if (responseLower.includes('form') || responseLower.includes('technique')) {
      suggestions.push("How do I improve my form?");
    }
    if (responseLower.includes('progress')) {
      suggestions.push("Track my lifting progress");
    }
    if (responseLower.includes('recovery')) {
      suggestions.push("How important is rest?");
    }
  } else {
    // General fitness suggestions
    if (responseLower.includes('workout') || responseLower.includes('exercise')) {
      suggestions.push("Design my workout routine");
    }
    if (responseLower.includes('diet') || responseLower.includes('nutrition')) {
      suggestions.push("Help me with meal planning");
    }
    if (responseLower.includes('goal') || responseLower.includes('target')) {
      suggestions.push("Calculate my health metrics");
    }
  }
  
  // Context-aware suggestions based on response content
  if (responseLower.includes('tool') || responseLower.includes('calculate')) {
    suggestions.push("What else can you help me track?");
  }
  if (responseLower.includes('plan') || responseLower.includes('routine')) {
    suggestions.push("Save this plan for me");
  }
  if (responseLower.includes('progress') || responseLower.includes('track')) {
    suggestions.push("How do I measure progress?");
  }
  
  // Add some universal helpful suggestions if we don't have enough
  const universalSuggestions = [
    "Tell me more about this",
    "What's the next step?",
    "How long will this take?",
    "Any tips for staying consistent?",
    "What should I focus on first?",
    "How do I stay motivated?"
  ];
  
  // Fill remaining slots with universal suggestions
  while (suggestions.length < 4) {
    const randomSuggestion = universalSuggestions[Math.floor(Math.random() * universalSuggestions.length)];
    if (!suggestions.includes(randomSuggestion)) {
      suggestions.push(randomSuggestion);
    }
  }
  
  // If we have profile info, add personalized suggestions
  if (profile && suggestions.length < 4) {
    if (profile.fitnessGoal && !suggestions.some(s => s.includes(profile.fitnessGoal))) {
      suggestions.push(`Help me achieve my ${profile.fitnessGoal} goal`);
    }
    if (profile.experience === 'beginner') {
      suggestions.push("What should beginners focus on?");
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
      "What's a good training routine?"
    ],
    'weight-loss': [
      "Calculate my daily calorie needs",
      "Create a weight loss meal plan",
      "What exercises burn the most calories?",
      "How do I stay motivated?"
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