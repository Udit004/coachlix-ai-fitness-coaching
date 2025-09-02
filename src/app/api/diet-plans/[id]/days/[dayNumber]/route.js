// api/diet-plans/[id]/days/[dayNumber]/route.js - Single day operations
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// PUT /api/diet-plans/[id]/days/[dayNumber] - Update specific day
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

    const dayData = await request.json();
    const resolvedParams = await params; // ✅ Await params
    const dayNumber = parseInt(resolvedParams.dayNumber);

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

    // Find and update the day
    const dayIndex = dietPlan.days.findIndex(
      (day) => day.dayNumber === dayNumber
    );
    if (dayIndex === -1) {
      return NextResponse.json({ message: "Day not found" }, { status: 404 });
    }

    // Update day data
    Object.assign(dietPlan.days[dayIndex], dayData);

    const savedPlan = await dietPlan.save();

    // Invalidate cache for this plan
    const cache = (await import('@/lib/simpleCache')).default;
    const cacheKey = `diet-plan:${resolvedParams.id}:${user.uid}`;
    cache.delete(cacheKey);

    return NextResponse.json(savedPlan.toObject());
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}