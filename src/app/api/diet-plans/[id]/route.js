// api/diet-plans/[id]/route.js - Single diet plan operations with caching
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";
import { redis } from "@/lib/redis";

// GET /api/diet-plans/[id] - Get specific diet plan
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

    // Await params first (Next.js 15+ requirement)
    const { id } = await params;
    
    // Try cache first - Individual plan ko cache se load karo
    const cacheKey = `user:diet-plan:${user.uid}:${id}`;
    try {
      const cachedPlan = await redis.get(cacheKey);
      if (cachedPlan) {
        console.log(`✅ Cache HIT: Diet plan ${id}`);
        return NextResponse.json({
          success: true,
          plan: cachedPlan,
          cached: true,
        });
      }
      console.log(`❌ Cache MISS: Fetching plan ${id} from DB`);
    } catch (cacheError) {
      console.error("Cache read error:", cacheError);
    }

    await connectDB();
    
    const plan = await DietPlan.findOne({ _id: id, userId: user.uid });
    
    if (!plan) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cache individual plan for longer - Detail zyada time tak cache
    try {
      await redis.setex(cacheKey, 1800, JSON.stringify(plan)); // 30 minutes
      console.log(`💾 Cached individual plan ${id}`);
    } catch (cacheError) {
      console.error("Cache write error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plan,
    });
    
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/diet-plans/[id] - Update specific diet plan
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

    // Await params first
    const { id } = await params;
    
    await connectDB();

    const body = await request.json();

    const updatedPlan = await DietPlan.findOneAndUpdate(
      { _id: id, userId: user.uid },
      { $set: { ...body, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Invalidate cache
    try {
      const listPattern = `user:diet-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      const planKey = `user:diet-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      console.log(`🗑️ Invalidated cache for plan ${id}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: "Diet plan updated successfully",
    });
    
  } catch (error) {
    console.error("Error updating diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/diet-plans/[id] - Delete specific diet plan
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

    // Await params first
    const { id } = await params;
    
    await connectDB();

    const deletedPlan = await DietPlan.findOneAndDelete({ _id: id, userId: user.uid });

    if (!deletedPlan) {
      return NextResponse.json(
        { message: "Diet plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Invalidate cache
    try {
      const listPattern = `user:diet-plans-list:${user.uid}:*`;
      const listKeys = await redis.keys(listPattern);
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map(key => redis.del(key)));
      }
      
      const planKey = `user:diet-plan:${user.uid}:${id}`;
      await redis.del(planKey);
      
      console.log(`🗑️ Invalidated cache for deleted plan ${id}`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
    }

    return NextResponse.json({
      success: true,
      message: "Diet plan deleted successfully",
    });
    
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
