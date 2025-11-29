// api/workout-plans/[id]/route.js - Individual workout plan operations with caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import { redis } from "@/lib/redis";

// GET /api/workout-plans/[id] - Get specific workout plan
export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15+)
    const { id } = await params;
    
    // Try cache first
    const cacheKey = `user:workout-plan:${user.uid}:${id}`;
    try {
      const cachedPlan = await redis.get(cacheKey);
      if (cachedPlan) {
        console.log(`✅ Cache HIT: Workout plan ${id}`);
        return NextResponse.json({
          success: true,
          plan: cachedPlan,
          cached: true,
        });
      }
      console.log(`❌ Cache MISS: Fetching workout plan ${id} from DB`);
    } catch (cacheError) {
      console.error("Cache read error:", cacheError);
    }

    await connectDB();
    
    const plan = await WorkoutPlan.findOne({ _id: id, userId: user.uid });
    
    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cache individual plan for 30 minutes
    try {
      await redis.setex(cacheKey, 1800, JSON.stringify(plan));
      console.log(`💾 Cached individual workout plan ${id}`);
    } catch (cacheError) {
      console.error("Cache write error:", cacheError);
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
    const body = await request.json();

    const updatedPlan = await WorkoutPlan.findOneAndUpdate(
      { _id: id, userId: user.uid },
      { $set: { ...body, updatedAt: new Date() } },
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
      
      const planKey = `user:workout-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      // Clear session caches
      const sessionPattern = `user:workout-session:${user.uid}:${id}:*`;
      const sessionKeys = await redis.keys(sessionPattern);
      if (sessionKeys && sessionKeys.length > 0) {
        await Promise.all(sessionKeys.map(key => redis.del(key)));
      }
      
      console.log(`🗑️ Invalidated cache for workout plan ${id}`);
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

// DELETE /api/workout-plans/[id] - Delete specific workout plan
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

    const deletedPlan = await WorkoutPlan.findOneAndDelete({ _id: id, userId: user.uid });

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
      
      const planKey = `user:workout-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      // Clear all session caches
      const sessionPattern = `user:workout-session:${user.uid}:${id}:*`;
      const sessionKeys = await redis.keys(sessionPattern);
      if (sessionKeys && sessionKeys.length > 0) {
        await Promise.all(sessionKeys.map(key => redis.del(key)));
      }
      
      console.log(`🗑️ Invalidated cache for deleted workout plan ${id}`);
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