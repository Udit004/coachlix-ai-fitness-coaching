// api/workout-plans/[id]/route.js - Individual workout plan operations
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";

// GET /api/workout-plans/[id] - Get specific workout plan
export async function GET(request, { params }) {
  try {
    // Await params before destructuring
    const { id: planId } = await params;
    
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

    // Find the workout plan
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      $or: [
        { userId: user.uid }, // User's own plan
        { isTemplate: true, isPublic: true } // Public template
      ]
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Error fetching workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/workout-plans/[id] - Update specific workout plan
export async function PUT(request, { params }) {
  try {
    // Await params before destructuring
    const { id: planId } = await params;
    
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

    const updateData = await request.json();

    // Find and update the workout plan
    const updatedPlan = await WorkoutPlan.findOneAndUpdate(
      { _id: planId, userId: user.uid },
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Send notification for workout plan update
    try {
      const userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Workout Plan Updated! 📝",
          `Your "${updatedPlan.name}" workout plan has been successfully updated.`,
          {
            type: "workout_plan_updated",
            planId: updatedPlan._id.toString(),
            planName: updatedPlan.name,
            goal: updatedPlan.goal,
          }
        );
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "workout_plan_updated",
                  description: `Updated workout plan: ${updatedPlan.name}`,
                  timestamp: new Date(),
                  details: {
                    planName: updatedPlan.name,
                    goal: updatedPlan.goal,
                  }
                }],
                $slice: -10,
              },
            },
          }
        );
      }
    } catch (notificationError) {
      console.error("Failed to send workout plan update notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: "Workout plan updated successfully",
    });
    
  } catch (error) {
    console.error("Error updating workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/workout-plans/[id] - Delete specific workout plan
export async function DELETE(request, { params }) {
  try {
    // Await params before destructuring
    const { id: planId } = await params;
    
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

    // Find the plan first to get its name for notification
    const planToDelete = await WorkoutPlan.findOne({ _id: planId, userId: user.uid });
    
    if (!planToDelete) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the workout plan
    await WorkoutPlan.findOneAndDelete({ _id: planId, userId: user.uid });

    // Send notification for workout plan deletion
    try {
      const userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Workout Plan Deleted 🗑️",
          `Your "${planToDelete.name}" workout plan has been deleted.`,
          {
            type: "workout_plan_deleted",
            planName: planToDelete.name,
            goal: planToDelete.goal,
          }
        );
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "workout_plan_deleted",
                  description: `Deleted workout plan: ${planToDelete.name}`,
                  timestamp: new Date(),
                  details: {
                    planName: planToDelete.name,
                    goal: planToDelete.goal,
                  }
                }],
                $slice: -10,
              },
            },
          }
        );
      }
    } catch (notificationError) {
      console.error("Failed to send workout plan deletion notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Workout plan deleted successfully",
    });
    
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}