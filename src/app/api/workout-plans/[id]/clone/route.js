// api/workout-plans/[id]/clone/route.js - Clone workout plan
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";

// POST /api/workout-plans/[id]/clone - Clone workout plan
export async function POST(request, { params }) {
  try {
    const { id: planId } = params;
    
    // Verify authentication
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

    const body = await request.json();
    const { name: newName } = body;

    if (!newName) {
      return NextResponse.json(
        { message: "New plan name is required" },
        { status: 400 }
      );
    }

    // Find the original plan
    const originalPlan = await WorkoutPlan.findOne({
      _id: planId,
      $or: [
        { userId: user.uid }, // User's own plan
        { isTemplate: true, isPublic: true } // Public template
      ]
    });

    if (!originalPlan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create cloned plan data
    const clonedPlanData = {
      userId: user.uid,
      name: newName.trim(),
      description: `Copy of ${originalPlan.name}`,
      goal: originalPlan.goal,
      difficulty: originalPlan.difficulty,
      duration: originalPlan.duration,
      workoutFrequency: originalPlan.workoutFrequency,
      weeks: originalPlan.weeks,
      targetMuscleGroups: originalPlan.targetMuscleGroups,
      equipment: originalPlan.equipment,
      tags: [...(originalPlan.tags || []), 'cloned'],
      createdBy: 'user',
      templateId: originalPlan._id,
      isTemplate: false,
      isPublic: false,
      isActive: false
    };

    // Create the new workout plan
    const clonedPlan = new WorkoutPlan(clonedPlanData);
    const savedPlan = await clonedPlan.save();

    // Send notification for workout plan cloning
    try {
      const userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Workout Plan Cloned! 📋",
          `Successfully cloned "${originalPlan.name}" as "${newName}".`,
          {
            type: "workout_plan_cloned",
            planId: savedPlan._id.toString(),
            planName: newName,
            originalPlanName: originalPlan.name,
          }
        );
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "workout_plan_cloned",
                  description: `Cloned workout plan: ${originalPlan.name} → ${newName}`,
                  timestamp: new Date(),
                  details: {
                    originalPlanName: originalPlan.name,
                    newPlanName: newName,
                    goal: savedPlan.goal,
                  }
                }],
                $slice: -10,
              },
            },
          }
        );
      }
    } catch (notificationError) {
      console.error("Failed to send workout plan clone notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      message: "Workout plan cloned successfully",
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error cloning workout plan:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}