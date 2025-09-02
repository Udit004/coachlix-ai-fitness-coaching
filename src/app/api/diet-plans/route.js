// api/diet-plans/route.js - Main diet plans endpoint with notifications and caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import DietPlan from "@/models/DietPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";
// Disabled simple in-memory cache for per-user lists to avoid stale reads across serverless instances

// GET /api/diet-plans - Get all diet plans for user
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
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort");

    // Bypass server-side in-memory caching to ensure fresh data per request

    // Build query
    let query = { userId: user.uid };
    if (active === "true") query.isActive = true;
    if (goal) query.goal = goal;

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
      }
    }

    // Execute query
    let queryBuilder = DietPlan.find(query).sort(sortObj);
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
    console.error("Error fetching diet plans:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/diet-plans - Create new diet plan with notifications
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
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      duration,
    } = body;

    if (!name || !goal || !targetCalories || !duration) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: name, goal, targetCalories, duration",
        },
        { status: 400 }
      );
    }

    const days = body.days || [];

    // Validate that the number of days matches the duration
    if (days.length !== duration) {
      return NextResponse.json(
        {
          message: `The number of days (${days.length}) does not match the duration (${duration}).`,
        },
        { status: 400 }
      );
    }

    // Create new diet plan
    const dietPlan = new DietPlan({
      userId: user.uid,
      name: name.trim(),
      description: body.description?.trim(),
      goal,
      targetCalories,
      targetProtein: targetProtein || 0,
      targetCarbs: targetCarbs || 0,
      targetFats: targetFats || 0,
      duration,
      days,
      difficulty: body.difficulty || "Beginner",
      tags: body.tags || [],
      createdBy: body.createdBy || "user",
    });

    const savedPlan = await dietPlan.save();

    // No in-memory cache to invalidate; responses are non-cached

    // Initialize notification tracking
    let notificationSent = false;
    let userData = null;

    // Send notification for diet plan creation
    try {
      console.log("📋 Diet plan created, checking for push token...");
      
      // Get user's push token
      userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        console.log("📱 Sending diet plan creation notification...");
        
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "New Diet Plan Created! 🥗",
          `Your "${name}" diet plan is ready to help you reach your ${goal.toLowerCase()} goal!`,
          {
            type: "diet_plan_created",
            planId: savedPlan._id.toString(),
            planName: name,
            goal: goal,
          }
        );
        
        console.log("✅ Diet plan creation notification sent successfully");
        notificationSent = true;
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "diet_plan_created",
                  description: `Created new diet plan: ${name}`,
                  timestamp: new Date(),
                  details: {
                    planName: name,
                    goal: goal,
                    targetCalories: targetCalories,
                  }
                }],
                $slice: -10, // Keep only last 10 activities
              },
            },
          }
        );
      } else {
        console.log("❌ No push token found for user");
      }
    } catch (notificationError) {
      console.error("❌ Failed to send diet plan creation notification:", notificationError);
      // Don't break the creation if notification fails
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      message: "Diet plan created successfully",
      notification: {
        sent: notificationSent,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating diet plan:", error);

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

// PUT /api/diet-plans - Update diet plan with notifications
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

    // Ensure consistency between duration and days array
    if (updateData.duration && updateData.days) {
      if (updateData.duration !== updateData.days.length) {
        return NextResponse.json(
          { message: "Duration and days array length must match" },
          { status: 400 }
        );
      }
    } else if (updateData.duration && !updateData.days) {
        return NextResponse.json(
            { message: "If updating duration, days array must be provided" },
            { status: 400 }
        );
    } else if (!updateData.duration && updateData.days) {
        return NextResponse.json(
            { message: "If updating days array, duration must be provided" },
            { status: 400 }
        );
    }

    // Find and update the diet plan
    const updatedPlan = await DietPlan.findOneAndUpdate(
      { _id: planId, userId: user.uid },
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // No in-memory cache to invalidate; responses are non-cached

    // Initialize notification tracking
    let notificationSent = false;
    let userData = null;

    // Send notification for diet plan update
    try {
      console.log("📋 Diet plan updated, checking for push token...");
      
      // Get user's push token
      userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        console.log("📱 Sending diet plan update notification...");
        
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Diet Plan Updated! 📝",
          `Your "${updatedPlan.name}" diet plan has been successfully updated.`,
          {
            type: "diet_plan_updated",
            planId: updatedPlan._id.toString(),
            planName: updatedPlan.name,
            goal: updatedPlan.goal,
          }
        );
        
        console.log("✅ Diet plan update notification sent successfully");
        notificationSent = true;
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "diet_plan_updated",
                  description: `Updated diet plan: ${updatedPlan.name}`,
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
      console.error("❌ Failed to send diet plan update notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: "Diet plan updated successfully",
      notification: {
        sent: notificationSent,
      }
    });
    
  } catch (error) {
    console.error("Error updating diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/diet-plans - Delete diet plan with notifications
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
    const planToDelete = await DietPlan.findOne({ _id: planId, userId: user.uid });
    
    if (!planToDelete) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the diet plan
    const deletedPlan = await DietPlan.findOneAndDelete({ _id: planId, userId: user.uid });

    // No in-memory cache to invalidate; responses are non-cached

    // Initialize notification tracking
    let notificationSent = false;
    let userData = null;

    // Send notification for diet plan deletion
    try {
      console.log("📋 Diet plan deleted, checking for push token...");
      
      // Get user's push token
      userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        console.log("📱 Sending diet plan deletion notification...");
        
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Diet Plan Deleted 🗑️",
          `Your "${planToDelete.name}" diet plan has been deleted.`,
          {
            type: "diet_plan_deleted",
            planName: planToDelete.name,
            goal: planToDelete.goal,
          }
        );
        
        console.log("✅ Diet plan deletion notification sent successfully");
        notificationSent = true;
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "diet_plan_deleted",
                  description: `Deleted diet plan: ${planToDelete.name}`,
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
      console.error("❌ Failed to send diet plan deletion notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Diet plan deleted successfully",
      notification: {
        sent: notificationSent,
      }
    });
    
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}