// api/diet-plans/[id]/clone/route.js - Clone diet plan
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import User from "@/models/userProfileModel";
import { NotificationService } from "@/lib/notificationService";


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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Name is required for cloned plan" },
        { status: 400 }
      );
    }

    const resolvedParams = await params;

    // Find original plan
    const originalPlan = await DietPlan.findOne({
      _id: resolvedParams.id,
      userId: user.uid,
    });

    if (!originalPlan) {
      return NextResponse.json(
        { message: "Original diet plan not found" },
        { status: 404 }
      );
    }

    // Create cloned plan
    const clonedPlan = new DietPlan({
      userId: user.uid,
      name: name.trim(),
      description: originalPlan.description
        ? `${originalPlan.description} (Cloned)`
        : null,
      goal: originalPlan.goal,
      targetCalories: originalPlan.targetCalories,
      targetProtein: originalPlan.targetProtein,
      targetCarbs: originalPlan.targetCarbs,
      targetFats: originalPlan.targetFats,
      duration: originalPlan.duration,
      days: originalPlan.days.map((day) => ({
        ...day.toObject(),
        _id: undefined, // Remove _id to create new ones
      })),
      difficulty: originalPlan.difficulty,
      tags: [...originalPlan.tags],
      createdBy: "user",
    });

    const savedClone = await clonedPlan.save();

    // Send notification to user if push token exists
    try {
      const userDoc = await User.findOne({ firebaseUid: user.uid });
      if (userDoc?.pushToken) {
        await NotificationService.sendCustomNotification(
          userDoc.pushToken,
          "Diet Plan Cloned ✅",
          `Your plan "${originalPlan.name}" was cloned as "${name.trim()}"`,
          {
            type: "diet_plan_cloned",
            planId: savedClone._id.toString(),
            planName: savedClone.name,
          }
        );
      }
    } catch (notifyError) {
      console.error("Failed to send clone notification:", notifyError);
    }

    return NextResponse.json(savedClone, { status: 201 });
  } catch (error) {
    console.error("Error cloning diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
