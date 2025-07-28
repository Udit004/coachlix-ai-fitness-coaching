// api/diet-plans/[id]/days/[dayNumber]/meals/route.js - Manage meals
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// POST /api/diet-plans/[id]/days/[dayNumber]/meals - Add meal to day
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

    const mealData = await request.json();
    const resolvedParams = await params; // ✅ Await params
    const dayNumber = parseInt(resolvedParams.dayNumber);

    if (!mealData.type) {
      return NextResponse.json(
        { message: "Meal type is required" },
        { status: 400 }
      );
    }

    const dietPlan = await DietPlan.findOne({
      _id: resolvedParams.id,
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

    // Add meal to day
    day.meals.push({
      type: mealData.type,
      items: mealData.items || [],
    });

    const savedPlan = await dietPlan.save();

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error("Error adding meal:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}