// api/diet-plans/route.js - Main diet plans endpoint with notifications and caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import DietPlan from "@/models/DietPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";
import { redis } from "@/lib/redis";

// Cache TTL configurations
const CACHE_TTL = {
  PLAN_LIST: 300,      // 5 minutes - List ko kam time
  PLAN_DETAIL: 1800,   // 30 minutes - Detail ko zyada time
  PLAN_SUMMARY: 600,   // 10 minutes - Summary medium time
};

// GET /api/diet-plans - Get all diet plans for user
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const goal = searchParams.get("goal");
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort");

    // Cache key based on filters
    const cacheKey = `user:diet-plans-list:${user.uid}:${active || 'all'}:${goal || 'all'}:${sort || 'default'}`;
    
    try {
      // Try cache first - Pehle cache check karo
      const cachedList = await redis.get(cacheKey);
      if (cachedList) {
        console.log(`✅ Cache HIT: Diet plans list for ${user.uid}`);
        return NextResponse.json({
          success: true,
          plans: cachedList,
          count: cachedList.length,
          cached: true,
        });
      }
      console.log(`❌ Cache MISS: Fetching from DB for ${user.uid}`);
    } catch (cacheError) {
      console.error("Cache read error:", cacheError);
      // Continue to DB if cache fails
    }

    // Build query
    let query = { userId: user.uid };
    if (active === "true") query.isActive = true;
    if (goal) query.goal = goal;

    let sortObj = { createdAt: -1 };
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

    let queryBuilder = DietPlan.find(query).sort(sortObj);
    if (limit) queryBuilder = queryBuilder.limit(parseInt(limit));

    const plans = await queryBuilder.exec();

    // Cache the list - List ko cache karo
    try {
      await redis.setex(cacheKey, CACHE_TTL.PLAN_LIST, JSON.stringify(plans));
      console.log(`💾 Cached diet plans list for ${user.uid}`);
    } catch (cacheError) {
      console.error("Cache write error:", cacheError);
    }

    const response = NextResponse.json({
      success: true,
      plans,
      count: plans.length,
    });
    
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

// POST /api/diet-plans - Create new diet plan
export async function POST(request) {
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

    const body = await request.json();

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

    if (days.length !== duration) {
      return NextResponse.json(
        {
          message: `The number of days (${days.length}) does not match the duration (${duration}).`,
        },
        { status: 400 }
      );
    }

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

    // Invalidate cache - Saari related cache clear karo
    try {
      const pattern = `user:diet-plans-list:${user.uid}:*`;
      // Redis pattern matching ke liye keys command
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
        console.log(`🗑️ Invalidated ${keys.length} cache entries for user ${user.uid}`);
      }
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    let notificationSent = false;
    let userData = null;

    try {
      console.log("📋 Diet plan created, checking for push token...");
      
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
                $slice: -10,
              },
            },
          }
        );
      } else {
        console.log("❌ No push token found for user");
      }
    } catch (notificationError) {
      console.error("❌ Failed to send diet plan creation notification:", notificationError);
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

// PUT /api/diet-plans - Update diet plan
export async function PUT(request) {
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

    const body = await request.json();
    const { planId, ...updateData } = body;

    if (!planId) {
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 }
      );
    }

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

    // Invalidate both list and individual plan cache
    try {
      // Clear list cache
      const listPattern = `user:diet-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      // Clear individual plan cache
      const planKey = `user:diet-plan:${user.uid}:${planId}`;
      await redis.del(planKey);
      
      console.log(`🗑️ Invalidated cache for plan ${planId}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    let notificationSent = false;
    let userData = null;

    try {
      console.log("📋 Diet plan updated, checking for push token...");
      
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

// DELETE /api/diet-plans - Delete diet plan
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 }
      );
    }

    const planToDelete = await DietPlan.findOne({ _id: planId, userId: user.uid });
    
    if (!planToDelete) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    const deletedPlan = await DietPlan.findOneAndDelete({ _id: planId, userId: user.uid });

    // Invalidate cache
    try {
      // Clear list cache
      const listPattern = `user:diet-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      // Clear individual plan cache
      const planKey = `user:diet-plan:${user.uid}:${planId}`;
      await redis.del(planKey);
      
      console.log(`🗑️ Invalidated cache for deleted plan ${planId}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    let notificationSent = false;
    let userData = null;

    try {
      console.log("📋 Diet plan deleted, checking for push token...");
      
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