// api/diet-plans/[id]/days/route.js - Manage days in diet plan
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// POST /api/diet-plans/[id]/days - Add new day
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

    const dayData = await request.json();
    const resolvedParams = await params; // ✅ Await params

    if (!dayData.dayNumber) {
      return NextResponse.json(
        { message: "dayNumber is required" },
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

    // Check if day already exists
    const existingDay = dietPlan.days.find(
      (day) => day.dayNumber === dayData.dayNumber
    );
    if (existingDay) {
      return NextResponse.json(
        { message: "Day already exists" },
        { status: 400 }
      );
    }

    // Add new day
    dietPlan.days.push({
      dayNumber: dayData.dayNumber,
      meals: dayData.meals || [],
      notes: dayData.notes,
      waterIntake: dayData.waterIntake || 0,
    });

    const savedPlan = await dietPlan.save();

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error("Error adding day:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
