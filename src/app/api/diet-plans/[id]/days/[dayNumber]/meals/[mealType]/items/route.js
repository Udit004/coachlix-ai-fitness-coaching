// api/diet-plans/[id]/days/[dayNumber]/meals/[mealType]/items/route.js - Manage food items
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// POST - Add food item to meal
export async function POST(request, { params }) {
  try {
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

    await connectDB();

    const foodItem = await request.json();
    const dayNumber = parseInt(params.dayNumber);
    const mealType = params.mealType;

    // Validate food item
    if (!foodItem.name || typeof foodItem.calories !== "number") {
      return NextResponse.json(
        { message: "Food item must have name and calories" },
        { status: 400 }
      );
    }

    const dietPlan = await DietPlan.findOne({
      _id: params.id,
      userId: user.uid,
    });

    if (!dietPlan) {
      return NextResponse.json(
        { message: "Diet plan not found" },
        { status: 404 }
      );
    }

    const day = dietPlan.days.find((day) => day.dayNumber === dayNumber);
    if (!day) {
      return NextResponse.json({ message: "Day not found" }, { status: 404 });
    }

    const meal = day.meals.find((meal) => meal.type === mealType);
    if (!meal) {
      return NextResponse.json({ message: "Meal not found" }, { status: 404 });
    }

    // Add food item
    meal.items.push({
      name: foodItem.name.trim(),
      calories: foodItem.calories,
      protein: foodItem.protein || 0,
      carbs: foodItem.carbs || 0,
      fats: foodItem.fats || 0,
      quantity: foodItem.quantity || "1 serving",
      notes: foodItem.notes?.trim(),
    });

    const savedPlan = await dietPlan.save();

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error("Error adding food item:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
