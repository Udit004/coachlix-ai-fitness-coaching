import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, plan, conversationHistory } = await request.json();

    // System prompts based on the selected plan
    const systemPrompts = {
      general: "You are a professional fitness coach. Provide personalized workout plans, nutrition advice, and general fitness guidance. Keep responses practical, motivating, and safe.",
      badminton: "You are a specialized badminton coach with expertise in technique, strategy, conditioning, and match preparation. Focus on sport-specific training, footwork, and performance optimization.",
      'weight-loss': "You are a weight loss specialist. Provide evidence-based advice on nutrition, calorie management, sustainable eating habits, and effective exercise routines for weight loss.",
      'muscle-gain': "You are a muscle building expert. Focus on resistance training, progressive overload, protein optimization, recovery protocols, and safe muscle building strategies."
    };

    const systemPrompt = systemPrompts[plan] || systemPrompts.general;

    // Prepare messages for the API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Include conversation history for context
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call DeepSeek API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Fitness Coach'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Generate contextual suggestions based on the response and plan
    const suggestions = generateSuggestions(aiResponse, plan);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get AI response',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

function generateSuggestions(response, plan) {
  const baseSuggestions = {
    general: [
      "Tell me more about this",
      "Create a weekly schedule",
      "What equipment do I need?",
      "How do I track progress?"
    ],
    badminton: [
      "Show me specific drills",
      "Pre-match preparation routine",
      "Injury prevention tips",
      "Equipment recommendations"
    ],
    'weight-loss': [
      "Meal prep ideas",
      "How to stay motivated?",
      "Track my calories",
      "Exercise alternatives"
    ],
    'muscle-gain': [
      "Supplement recommendations",
      "Recovery strategies",
      "Progressive overload plan",
      "Protein timing"
    ]
  };

  // You can make this more intelligent by analyzing the response content
  return baseSuggestions[plan] || baseSuggestions.general;
}