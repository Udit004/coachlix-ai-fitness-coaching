// api/exercises/ai-search/route.js
import { NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/verifyUser";

export async function POST(request) {
  try {
    // Enhanced auth header extraction (following diet-plans pattern)
    const authHeader =
      request.headers.get("Authorization") ||
      request.headers.get("authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { exerciseName } = await request.json();

    if (!exerciseName || exerciseName.trim() === '') {
      return NextResponse.json(
        { message: "Exercise name is required" },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("Gemini API key not found in environment variables");
      return NextResponse.json(
        { message: "AI service configuration error" },
        { status: 500 }
      );
    }

    // Enhanced system prompt for exercise information generation
    const systemPrompt = `You are a professional fitness expert and exercise database specialist. Your task is to provide comprehensive, accurate exercise information based on the exercise name provided.

For the given exercise name, provide a detailed JSON response with the following structure:
{
  "name": "Proper exercise name",
  "category": "Exercise category (Strength/Cardio/Flexibility/Sports)",
  "difficulty": "Beginner/Intermediate/Advanced",
  "primaryMuscleGroups": ["array of primary muscles worked"],
  "secondaryMuscleGroups": ["array of secondary muscles worked"],
  "equipment": ["required equipment or bodyweight"],
  "instructions": ["step 1", "step 2", "step 3", "etc."],
  "description": "Brief description of the exercise",
  "tips": ["important form tips", "safety considerations"],
  "variations": ["easier variations", "harder variations"],
  "targetReps": "Recommended repetitions or duration",
  "restTime": "Recommended rest time between sets",
  "calories": "Approximate calories burned per minute (if applicable)",
  "benefits": ["key benefits of this exercise"]
}

Guidelines:
- Provide accurate, safe exercise information only
- If the exercise name is unclear or potentially dangerous, suggest safer alternatives
- Use proper anatomical terms for muscle groups
- Include safety considerations in tips
- Be specific with instructions
- Only respond with valid JSON format
- If you don't recognize the exercise, provide a similar safe alternative

Exercise name to analyze: "${exerciseName.trim()}"`;

    // Prepare Gemini API request
    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2000,
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

    // Make API call to Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

    console.log("🤖 Making AI request for exercise:", exerciseName);

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
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response generated from AI");
    }

    // Check if response was blocked by safety filters
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      throw new Error("Response was blocked by safety filters. Please try a different exercise name.");
    }

    console.log("✅ AI response received successfully");

    // Try to parse the JSON response
    let exerciseInfo;
    try {
      // Clean the response (remove any markdown formatting)
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      exerciseInfo = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: return the raw response
      exerciseInfo = {
        name: exerciseName,
        description: aiResponse,
        category: "General", 
        difficulty: "Intermediate",
        primaryMuscleGroups: [],
        secondaryMuscleGroups: [],
        equipment: ["Unknown"],
        instructions: ["Please check the description for detailed instructions"],
        tips: [],
        variations: [],
        targetReps: "Consult description",
        restTime: "60-90 seconds",
        benefits: []
      };
    }

    // Validate and sanitize the response
    const validatedExercise = {
      name: exerciseInfo.name || exerciseName,
      category: exerciseInfo.category || "General",
      difficulty: exerciseInfo.difficulty || "Intermediate", 
      primaryMuscleGroups: Array.isArray(exerciseInfo.primaryMuscleGroups) ? exerciseInfo.primaryMuscleGroups : [],
      secondaryMuscleGroups: Array.isArray(exerciseInfo.secondaryMuscleGroups) ? exerciseInfo.secondaryMuscleGroups : [],
      equipment: Array.isArray(exerciseInfo.equipment) ? exerciseInfo.equipment : ["Unknown"],
      instructions: Array.isArray(exerciseInfo.instructions) ? exerciseInfo.instructions : [],
      description: exerciseInfo.description || "Exercise information generated by AI",
      tips: Array.isArray(exerciseInfo.tips) ? exerciseInfo.tips : [],
      variations: Array.isArray(exerciseInfo.variations) ? exerciseInfo.variations : [],
      targetReps: exerciseInfo.targetReps || "Consult trainer",
      restTime: exerciseInfo.restTime || "60-90 seconds",
      calories: exerciseInfo.calories || null,
      benefits: Array.isArray(exerciseInfo.benefits) ? exerciseInfo.benefits : [],
      // Add metadata
      createdBy: 'ai',
      isActive: true,
      tags: ['ai-generated'],
      averageRating: 0,
      popularity: 0
    };

    return NextResponse.json({
      success: true,
      exercise: validatedExercise,
      message: "Exercise information generated successfully"
    });

  } catch (error) {
    console.error("AI search failed:", error);
    
    // Return user-friendly error messages
    let errorMessage = "Failed to generate exercise information";
    let statusCode = 500;

    if (error.message.includes("API key")) {
      errorMessage = "AI service configuration error";
      statusCode = 500;
    } else if (error.message.includes("Rate limit")) {
      errorMessage = "Too many requests. Please try again in a moment.";
      statusCode = 429;
    } else if (error.message.includes("safety filters")) {
      errorMessage = "Unable to process this exercise name. Please try a different name.";
      statusCode = 400;
    } else if (error.message.includes("Unauthorized")) {
      errorMessage = "Authentication failed. Please log in again.";
      statusCode = 401;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}