// api/workout-plans/[id]/activate/route.js - Activate/Deactivate workout plan
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { redis } from "@/lib/redis";

// POST /api/workout-plans/[id]/activate - Set a workout plan as active
export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    await connectDB();

    // Verify the plan belongs to the user
    const plan = await WorkoutPlan.findOne({ _id: id, userId: user.uid });
    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Deactivate all other plans for this user
    await WorkoutPlan.updateMany(
      { userId: user.uid, _id: { $ne: id } },
      { $set: { isActive: false } }
    );

    // Activate this plan
    const activatedPlan = await WorkoutPlan.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );

    // Update recent activity
    try {
      await User.findOneAndUpdate(
        { firebaseUid: user.uid },
        {
          $push: {
            recentActivities: {
              $each: [{
                type: "workout_plan_activated",
                description: `Activated workout plan: ${activatedPlan.name}`,
                timestamp: new Date(),
                details: {
                  planName: activatedPlan.name,
                  goal: activatedPlan.goal,
                }
              }],
              $slice: -10,
            },
          },
        }
      );
    } catch (activityError) {
      console.error("Failed to update recent activity:", activityError);
    }

    // Invalidate cache for all workout plans
    try {
      const listPattern = `user:workout-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      // Clear cache for this specific plan
      const planKey = `user:workout-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      console.log(`✅ Invalidated cache for activated workout plan ${id}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plan: activatedPlan,
      message: "Workout plan activated successfully",
    });
    
  } catch (error) {
    console.error("Error activating workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/workout-plans/[id]/activate - Deactivate a workout plan
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    await connectDB();

    // Verify the plan belongs to the user
    const plan = await WorkoutPlan.findOne({ _id: id, userId: user.uid });
    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Deactivate this plan
    const deactivatedPlan = await WorkoutPlan.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    // Invalidate cache for all workout plans
    try {
      const listPattern = `user:workout-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      // Clear cache for this specific plan
      const planKey = `user:workout-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      console.log(`✅ Invalidated cache for deactivated workout plan ${id}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plan: deactivatedPlan,
      message: "Workout plan deactivated successfully",
    });
    
  } catch (error) {
    console.error("Error deactivating workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
