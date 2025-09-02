// api/workout-plans/route.js - Main workout plans endpoint with notifications and caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";
// Disabled simple in-memory cache for per-user lists to avoid stale reads across serverless instances

// GET /api/workout-plans - Get all workout plans for user
export async function GET(request) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const goal = searchParams.get("goal");
    const difficulty = searchParams.get("difficulty");
    const templates = searchParams.get("templates");
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort");

    // Bypass server-side in-memory caching to ensure fresh data per request

    // Build query
    let query = { userId: user.uid };
    if (active === "true") query.isActive = true;
    if (goal) query.goal = goal;
    if (difficulty) query.difficulty = difficulty;
    if (templates === "true") {
      query = { isTemplate: true, isPublic: true }; // Override for public templates
    }

    // Build sort object
    let sortObj = { createdAt: -1 }; // default
    if (sort) {
      switch (sort) {
        case "-createdAt":
        case "newest":
          sortObj = { createdAt: -1 };
          break;
        case "createdAt":
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        case "-updatedAt":
        case "updated":
          sortObj = { updatedAt: -1 };
          break;
        case "popular":
          sortObj = { 'stats.totalWorkouts': -1 };
          break;
        case "difficulty":
          sortObj = { difficulty: 1 };
          break;
      }
    }

    // Execute query
    let queryBuilder = WorkoutPlan.find(query).sort(sortObj);
    if (limit) queryBuilder = queryBuilder.limit(parseInt(limit));

    const plans = await queryBuilder.exec();

    const response = NextResponse.json({
      success: true,
      plans,
      count: plans.length,
    });
    // Ensure no HTTP-level caching for authenticated resources
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workout-plans - Create new workout plan with notifications
export async function POST(request) {
  try {
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

    // Validate required fields
    const {
      name,
      goal,
      duration,
      workoutFrequency
    } = body;

    if (!name || !goal || !duration) {
      return NextResponse.json(
        {
          message: "Missing required fields: name, goal, duration",
        },
        { status: 400 }
      );
    }

    // Create new workout plan
    const workoutPlan = new WorkoutPlan({
      userId: user.uid,
      name: name.trim(),
      description: body.description?.trim(),
      goal,
      difficulty: body.difficulty || "Beginner",
      duration,
      workoutFrequency: workoutFrequency || 3,
      weeks: body.weeks || [],
      targetMuscleGroups: body.targetMuscleGroups || [],
      equipment: body.equipment || [],
      tags: body.tags || [],
      createdBy: body.createdBy || "user",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      isTemplate: body.isTemplate || false,
      isPublic: body.isPublic || false
    });

    const savedPlan = await workoutPlan.save();

    // No in-memory cache to invalidate; responses are non-cached

    // Initialize notification tracking
    let notificationSent = false;
    let userData = null;

    // Send notification for workout plan creation
    try {
      console.log("🏋️ Workout plan created, checking for push token...");
      
      // Get user's push token
      userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        console.log("📱 Sending workout plan creation notification...");
        
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "New Workout Plan Created! 💪",
          `Your "${name}" workout plan is ready to help you achieve your ${goal.toLowerCase()} goal!`,
          {
            type: "workout_plan_created",
            planId: savedPlan._id.toString(),
            planName: name,
            goal: goal,
          }
        );
        
        console.log("✅ Workout plan creation notification sent successfully");
        notificationSent = true;
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "workout_plan_created",
                  description: `Created new workout plan: ${name}`,
                  timestamp: new Date(),
                  details: {
                    planName: name,
                    goal: goal,
                    duration: duration,
                    workoutFrequency: workoutFrequency
                  }
                }],
                $slice: -10,
              },
            },
          }
        );
      } else {
        console.log("❌ No push token found for user");
      }
    } catch (notificationError) {
      console.error("❌ Failed to send workout plan creation notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      message: "Workout plan created successfully",
      notification: {
        sent: notificationSent,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating workout plan:", error);

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

// PUT /api/workout-plans - Update workout plan with notifications
export async function PUT(request) {
  try {
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
    const { planId, ...updateData } = body;

    if (!planId) {
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 }
      );
    }

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

    // No in-memory cache to invalidate; responses are non-cached

    // Initialize notification tracking
    let notificationSent = false;
    let userData = null;

    // Send notification for workout plan update
    try {
      console.log("🏋️ Workout plan updated, checking for push token...");
      
      // Get user's push token
      userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        console.log("📱 Sending workout plan update notification...");
        
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
        
        console.log("✅ Workout plan update notification sent successfully");
        notificationSent = true;
        
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
      } else {
        console.log("❌ No push token found for user");
      }
    } catch (notificationError) {
      console.error("❌ Failed to send workout plan update notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: "Workout plan updated successfully",
      notification: {
        sent: notificationSent,
      }
    });
    
  } catch (error) {
    console.error("Error updating workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/workout-plans - Delete workout plan with notifications
export async function DELETE(request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Find the plan first to get its name for notification
    const planToDelete = await WorkoutPlan.findOne({ _id: planId, userId: user.uid });
    
    if (!planToDelete) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the workout plan
    const deletedPlan = await WorkoutPlan.findOneAndDelete({ _id: planId, userId: user.uid });

    // No in-memory cache to invalidate; responses are non-cached

    // Initialize notification tracking
    let notificationSent = false;
    let userData = null;

    // Send notification for workout plan deletion
    try {
      console.log("🏋️ Workout plan deleted, checking for push token...");
      
      // Get user's push token
      userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        console.log("📱 Sending workout plan deletion notification...");
        
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
        
        console.log("✅ Workout plan deletion notification sent successfully");
        notificationSent = true;
        
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
      } else {
        console.log("❌ No push token found for user");
      }
    } catch (notificationError) {
      console.error("❌ Failed to send workout plan deletion notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Workout plan deleted successfully",
      notification: {
        sent: notificationSent,
      }
    });
    
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}