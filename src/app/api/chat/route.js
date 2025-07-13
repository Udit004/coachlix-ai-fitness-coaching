import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { message, plan, conversationHistory, profile } = await request.json();

    // Enhanced system prompts with more personality and conversation skills
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

Always:
- Address the person by name when you know it
- Remember their goals, preferences, and previous conversations
- Provide actionable, specific advice
- Explain the "why" behind your recommendations
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

Always:
- Be compassionate about their struggles
- Avoid restrictive language or shame
- Focus on addition (adding healthy foods) rather than elimination
- Provide practical meal ideas and prep strategies
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

Your personality:
- Encouraging and motivational without being pushy
- Geek out about the science behind muscle building
- Share practical tips from years of experience
- Help them understand their body's signals
- Build confidence in the gym environment

Focus on:
- Creating progressive workout plans
- Explaining proper form and technique
- Optimizing nutrition for muscle growth
- Managing recovery and preventing burnout
- Building sustainable habits for long-term success`
    };

    let systemPrompt = systemPrompts[plan] || systemPrompts.general;

    // Enhanced personalization with conversation context
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

    // Add conversation context for continuity
    if (conversationHistory.length > 1) {
      personalContext += `\nConversation Context: This is an ongoing conversation. Remember previous topics and build upon them naturally. Reference past discussions when relevant.`;
    }

    if (personalContext) {
      systemPrompt = `${systemPrompt}${personalContext}`;
    }

    // Get API key from environment variables (more secure)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Gemini API key not found in environment variables.");
    }

    // Prepare conversation history for Gemini
    const contents = [];
    
    // Add system prompt as first user message
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    
    // Add a model response to acknowledge the system prompt
    contents.push({
      role: "model",
      parts: [{ text: "I understand. I'll respond as the fitness coach you've described." }]
    });

    // Add conversation history (last 10 exchanges to avoid token limits)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.type === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Correct Gemini API payload structure
    const geminiPayload = {
      contents: contents,
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1500,
        stopSequences: []
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Correct API endpoint for Gemini Pro
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error response:', errorBody);
      
      // Handle specific error cases
      if (response.status === 403) {
        throw new Error("API key is invalid or has insufficient permissions");
      } else if (response.status === 404) {
        throw new Error("Invalid API endpoint or model not found");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later");
      } else {
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    // Check if response contains error
    if (data.error) {
      console.error('Gemini API error:', data.error);
      throw new Error(data.error.message || "Unknown API error");
    }

    // Extract response from Gemini's response format
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response. Please try again.";

    // Check if response was blocked by safety filters
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      throw new Error("Response was blocked by safety filters. Please rephrase your message.");
    }

    // Generate contextual suggestions
    const suggestions = generateContextualSuggestions(aiResponse, plan, message, profile);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      suggestions: suggestions,
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "I'm having trouble connecting right now. Let me try again!",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

function generateContextualSuggestions(response, plan, userMessage, profile) {
  // More intelligent suggestion generation based on response content
  const suggestions = [];
  
  // Analyze the response content for better suggestions
  const responseLower = response.toLowerCase();
  const messageLower = userMessage.toLowerCase();
  
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
      suggestions.push("Give me meal prep ideas");
    }
    if (responseLower.includes('calorie') || responseLower.includes('deficit')) {
      suggestions.push("How do I calculate my calories?");
    }
    if (responseLower.includes('exercise') || responseLower.includes('workout')) {
      suggestions.push("What's the best cardio for me?");
    }
    if (responseLower.includes('motivation') || responseLower.includes('struggling')) {
      suggestions.push("I'm struggling with motivation");
    }
  } else if (plan === 'muscle-gain') {
    if (responseLower.includes('protein') || responseLower.includes('nutrition')) {
      suggestions.push("What protein sources are best?");
    }
    if (responseLower.includes('workout') || responseLower.includes('training')) {
      suggestions.push("Create my workout split");
    }
    if (responseLower.includes('recovery') || responseLower.includes('rest')) {
      suggestions.push("How important is rest for gains?");
    }
    if (responseLower.includes('supplement')) {
      suggestions.push("Do I need supplements?");
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
      suggestions.push("How do I track my progress?");
    }
  }
  
  // Add some universal helpful suggestions
  const universalSuggestions = [
    "Tell me more about this",
    "What's the next step?",
    "How long will this take?",
    "Any tips for staying consistent?"
  ];
  
  // Fill remaining slots with universal suggestions
  while (suggestions.length < 4) {
    const randomSuggestion = universalSuggestions[Math.floor(Math.random() * universalSuggestions.length)];
    if (!suggestions.includes(randomSuggestion)) {
      suggestions.push(randomSuggestion);
    }
  }
  
  // If we have profile info, add personalized suggestions
  if (profile) {
    if (profile.fitnessGoal && suggestions.length < 4) {
      suggestions.push(`Help me achieve my ${profile.fitnessGoal} goal`);
    }
    if (profile.experience === 'beginner' && suggestions.length < 4) {
      suggestions.push("What should beginners focus on?");
    }
  }
  
  return suggestions.slice(0, 4); // Return max 4 suggestions
}