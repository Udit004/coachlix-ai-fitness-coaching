// REPLACE your app/api/foods/search/route.js with this enhanced version:

import { verifyUserToken } from "@/lib/verifyUser";
import { NextResponse } from "next/server";

// Popular foods for quick matching
const POPULAR_FOODS = [
  {
    name: "Grilled Chicken Breast",
    calories: 165,
    protein: 31,
    carbohydrates: 0,
    fat: 3.6,
    serving_size: "100g",
    category: "protein"
  },
  {
    name: "Brown Rice",
    calories: 111,
    protein: 2.6,
    carbohydrates: 23,
    fat: 0.9,
    serving_size: "100g cooked",
    category: "carbohydrate"
  },
  {
    name: "Whole Wheat Bread",
    calories: 247,
    protein: 13,
    carbohydrates: 41,
    fat: 4.2,
    serving_size: "2 slices",
    category: "carbohydrate"
  },
  {
    name: "Eggs",
    calories: 155,
    protein: 13,
    carbohydrates: 1.1,
    fat: 11,
    serving_size: "2 large eggs",
    category: "protein"
  },
  {
    name: "Salmon Fillet",
    calories: 206,
    protein: 22,
    carbohydrates: 0,
    fat: 12,
    serving_size: "100g",
    category: "protein"
  },
  {
    name: "Sweet Potato",
    calories: 86,
    protein: 1.6,
    carbohydrates: 20,
    fat: 0.1,
    serving_size: "1 medium",
    category: "carbohydrate"
  },
  {
    name: "Greek Yogurt",
    calories: 59,
    protein: 10,
    carbohydrates: 3.6,
    fat: 0.4,
    serving_size: "100g",
    category: "protein"
  },
  {
    name: "Avocado",
    calories: 160,
    protein: 2,
    carbohydrates: 8.5,
    fat: 14.7,
    serving_size: "1/2 medium",
    category: "fat"
  },
  {
    name: "Banana",
    calories: 105,
    protein: 1.3,
    carbohydrates: 27,
    fat: 0.4,
    serving_size: "1 medium",
    category: "fruit"
  },
  {
    name: "Apple",
    calories: 95,
    protein: 0.5,
    carbohydrates: 25,
    fat: 0.3,
    serving_size: "1 medium",
    category: "fruit"
  }
];

async function searchFoodsWithAI(query) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Gemini API key not found");
    }

    const prompt = `You are a nutrition database. Find foods that match the search query: "${query}".

Return ONLY a JSON array of food objects, maximum 10 results. Each object should have this exact format:
[
  {
    "name": "Food Name",
    "calories": number (per 100g),
    "protein": number (grams per 100g),
    "carbohydrates": number (grams per 100g),
    "fat": number (grams per 100g),
    "serving_size": "100g",
    "category": "protein/carbohydrate/fat/vegetable/fruit"
  }
]

Focus on common, real foods that people would actually eat. If the query is too vague or no foods match, return an empty array [].`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      return [];
    }

    // Clean and parse JSON response
    const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
    const results = JSON.parse(cleanedResponse);
    
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("Error searching foods with AI:", error);
    return [];
  }
}

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        results: [],
        message: "Search query must be at least 2 characters"
      });
    }

    const searchTerm = query.trim().toLowerCase();

    // First, search in popular foods for quick results
    const popularMatches = POPULAR_FOODS.filter(food =>
      food.name.toLowerCase().includes(searchTerm) ||
      food.category.toLowerCase().includes(searchTerm)
    );

    // If we have popular matches, return them immediately
    if (popularMatches.length > 0) {
      return NextResponse.json({
        results: popularMatches.slice(0, 10),
        source: "popular"
      });
    }

    // If no popular matches, use AI search
    const aiResults = await searchFoodsWithAI(query);
    
    return NextResponse.json({
      results: aiResults,
      source: "ai"
    });

  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { 
        results: [],
        error: "Failed to search foods" 
      },
      { status: 500 }
    );
  }
}