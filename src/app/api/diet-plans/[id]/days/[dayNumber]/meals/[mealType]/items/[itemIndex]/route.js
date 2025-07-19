// api/diet-plans/[id]/days/[dayNumber]/meals/[mealType]/items/[itemIndex]/route.js
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// PUT - Update food item
export async function PUT(request, { params }) {
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
    const itemIndex = parseInt(params.itemIndex);

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

    if (itemIndex < 0 || itemIndex >= meal.items.length) {
      return NextResponse.json(
        { message: "Food item not found" },
        { status: 404 }
      );
    }

    // Update food item
    Object.assign(meal.items[itemIndex], foodItem);

    const savedPlan = await dietPlan.save();

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error("Error updating food item:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove food item
export async function DELETE(request, { params }) {
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

    const dayNumber = parseInt(params.dayNumber);
    const mealType = params.mealType;
    const itemIndex = parseInt(params.itemIndex);

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

    if (itemIndex < 0 || itemIndex >= meal.items.length) {
      return NextResponse.json(
        { message: "Food item not found" },
        { status: 404 }
      );
    }

    // Remove food item
    meal.items.splice(itemIndex, 1);

    const savedPlan = await dietPlan.save();

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error("Error deleting food item:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
