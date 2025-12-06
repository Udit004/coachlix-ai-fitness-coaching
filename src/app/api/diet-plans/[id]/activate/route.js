// api/diet-plans/[id]/activate/route.js - Activate/Deactivate diet plan
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { redis } from "@/lib/redis";

// POST /api/diet-plans/[id]/activate - Set a diet plan as active
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
    const plan = await DietPlan.findOne({ _id: id, userId: user.uid });
    if (!plan) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Deactivate all other plans for this user
    await DietPlan.updateMany(
      { userId: user.uid, _id: { $ne: id } },
      { $set: { isActive: false } }
    );

    // Activate this plan
    const activatedPlan = await DietPlan.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );

    // Invalidate all related caches
    try {
      const listPattern = `user:diet-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      // Clear cache for all plans that might have been affected
      const planPattern = `user:diet-plan:${user.uid}:*`;
      const planKeys = await redis.keys(planPattern);
      if (planKeys && planKeys.length > 0) {
        await Promise.all(planKeys.map(key => redis.del(key)));
      }
      
      console.log(`🗑️ Invalidated cache after activating plan ${id}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    // Update recent activity
    try {
      await User.findOneAndUpdate(
        { firebaseUid: user.uid },
        {
          $push: {
            recentActivities: {
              $each: [{
                type: "diet_plan_activated",
                description: `Activated diet plan: ${activatedPlan.name}`,
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

    return NextResponse.json({
      success: true,
      plan: activatedPlan,
      message: "Diet plan activated successfully",
    });
    
  } catch (error) {
    console.error("Error activating diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/diet-plans/[id]/activate - Deactivate a diet plan
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
    const plan = await DietPlan.findOne({ _id: id, userId: user.uid });
    if (!plan) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Deactivate this plan
    const deactivatedPlan = await DietPlan.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    // Invalidate all related caches
    try {
      const listPattern = `user:diet-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      const planKey = `user:diet-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      console.log(`🗑️ Invalidated cache after deactivating plan ${id}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plan: deactivatedPlan,
      message: "Diet plan deactivated successfully",
    });
    
  } catch (error) {
    console.error("Error deactivating diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
