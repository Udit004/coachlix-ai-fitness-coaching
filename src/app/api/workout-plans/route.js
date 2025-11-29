// api/workout-plans/route.js - Main workout plans endpoint with notifications and caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import { redis } from "@/lib/redis";

// Cache TTL configurations
const CACHE_TTL = {
  PLAN_LIST: 300,      // 5 minutes
  PLAN_DETAIL: 1800,   // 30 minutes
  SESSION: 600,        // 10 minutes
};

// GET /api/workout-plans - Get all workout plans
export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const difficulty = searchParams.get("difficulty");
    const goal = searchParams.get("goal");
    const sort = searchParams.get("sort");
    const limit = searchParams.get("limit");

    // Cache key based on filters
    const cacheKey = `user:workout-plans-list:${user.uid}:${active || 'all'}:${difficulty || 'all'}:${goal || 'all'}:${sort || 'default'}:${limit || 'all'}`;
    
    try {
      const cachedList = await redis.get(cacheKey);
      if (cachedList) {
        console.log(`✅ Cache HIT: Workout plans list for ${user.uid}`);
        return NextResponse.json({
          success: true,
          plans: cachedList,
          count: cachedList.length,
          cached: true,
        });
      }
      console.log(`❌ Cache MISS: Fetching workout plans from DB for ${user.uid}`);
    } catch (cacheError) {
      console.error("Cache read error:", cacheError);
    }

    await connectDB();

    // Build query
    let query = { userId: user.uid };
    if (active === "true") query.isActive = true;
    if (difficulty) query.difficulty = difficulty;
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
          sortObj = { updatedAt: -1 };
          break;
      }
    }

    let queryBuilder = WorkoutPlan.find(query).sort(sortObj);
    if (limit) queryBuilder = queryBuilder.limit(parseInt(limit));

    const plans = await queryBuilder.exec();

    // Cache the list
    try {
      await redis.setex(cacheKey, CACHE_TTL.PLAN_LIST, JSON.stringify(plans));
      console.log(`💾 Cached workout plans list for ${user.uid}`);
    } catch (cacheError) {
      console.error("Cache write error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plans,
      count: plans.length,
    });
    
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workout-plans - Create new workout plan
export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const workoutPlan = new WorkoutPlan({
      userId: user.uid,
      ...body,
    });

    const savedPlan = await workoutPlan.save();

    // Invalidate cache
    try {
      const pattern = `user:workout-plans-list:${user.uid}:*`;
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
        console.log(`🗑️ Invalidated ${keys.length} workout cache entries for user ${user.uid}`);
      }
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      message: "Workout plan created successfully",
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/workout-plans - Update workout plan
export async function PUT(request) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { planId, ...updateData } = body;

    if (!planId) {
      return NextResponse.json({ message: "Plan ID is required" }, { status: 400 });
    }

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

    // Invalidate cache
    try {
      const listPattern = `user:workout-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      const planKey = `user:workout-plan:${user.uid}:${planId}`;
      await redis.del(planKey);
      
      // Clear session caches
      const sessionPattern = `user:workout-session:${user.uid}:${planId}:*`;
      const sessionKeys = await redis.keys(sessionPattern);
      if (sessionKeys && sessionKeys.length > 0) {
        await Promise.all(sessionKeys.map(key => redis.del(key)));
      }
      
      console.log(`🗑️ Invalidated cache for workout plan ${planId}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
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

// DELETE /api/workout-plans - Delete workout plan
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json({ message: "Plan ID is required" }, { status: 400 });
    }

    await connectDB();

    const deletedPlan = await WorkoutPlan.findOneAndDelete({ _id: planId, userId: user.uid });

    if (!deletedPlan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Invalidate cache
    try {
      const listPattern = `user:workout-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      const planKey = `user:workout-plan:${user.uid}:${planId}`;
      await redis.del(planKey);
      
      // Clear all session caches for this plan
      const sessionPattern = `user:workout-session:${user.uid}:${planId}:*`;
      const sessionKeys = await redis.keys(sessionPattern);
      if (sessionKeys && sessionKeys.length > 0) {
        await Promise.all(sessionKeys.map(key => redis.del(key)));
      }
      
      console.log(`🗑️ Invalidated cache for deleted workout plan ${planId}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
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