// app/api/foods/popular/route.js
import { verifyUserToken } from "@/lib/verifyUser";
import { NextResponse } from "next/server";

// Popular foods based on common dietary choices
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
    name: "Oatmeal",
    calories: 124,
    protein: 5,
    carbohydrates: 21,
    fat: 2.5,
    serving_size: "100g cooked",
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
    name: "Broccoli",
    calories: 25,
    protein: 3,
    carbohydrates: 5,
    fat: 0.4,
    serving_size: "1 cup",
    category: "vegetable"
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
    name: "Almonds",
    calories: 164,
    protein: 6,
    carbohydrates: 6,
    fat: 14,
    serving_size: "28g",
    category: "fat"
  },
  {
    name: "Quinoa",
    calories: 120,
    protein: 4.4,
    carbohydrates: 22,
    fat: 1.9,
    serving_size: "100g cooked",
    category: "carbohydrate"
  },
  {
    name: "Tuna",
    calories: 116,
    protein: 25.5,
    carbohydrates: 0,
    fat: 1,
    serving_size: "100g",
    category: "protein"
  },
  {
    name: "Apple",
    calories: 95,
    protein: 0.5,
    carbohydrates: 25,
    fat: 0.3,
    serving_size: "1 medium",
    category: "fruit"
  },
  {
    name: "Spinach",
    calories: 7,
    protein: 0.9,
    carbohydrates: 1.1,
    fat: 0.1,
    serving_size: "1 cup",
    category: "vegetable"
  },
  {
    name: "Cottage Cheese",
    calories: 98,
    protein: 11,
    carbohydrates: 9,
    fat: 2.3,
    serving_size: "100g",
    category: "protein"
  },
  {
    name: "Blueberries",
    calories: 57,
    protein: 0.7,
    carbohydrates: 14,
    fat: 0.3,
    serving_size: "100g",
    category: "fruit"
  },
  {
    name: "Olive Oil",
    calories: 119,
    protein: 0,
    carbohydrates: 0,
    fat: 13.5,
    serving_size: "1 tbsp",
    category: "fat"
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
    name: "Lean Ground Turkey",
    calories: 120,
    protein: 26,
    carbohydrates: 0,
    fat: 2,
    serving_size: "100g",
    category: "protein"
  }
];

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit")) || 20;

    let results = [...POPULAR_FOODS];

    // Filter by category if specified
    if (category) {
      results = results.filter(food => 
        food.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply limit
    const limitedResults = results.slice(0, limit);

    return NextResponse.json(limitedResults);
  } catch (error) {
    console.error("Error fetching popular foods:", error);
    return NextResponse.json({ error: "Failed to fetch popular foods" }, { status: 500 });
  }
}