// api/diet-plans/[id]/route.js - Single diet plan operations with caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import cache from "@/lib/simpleCache";

// GET /api/diet-plans/[id] - Get specific diet plan
export async function GET(request, { params }) {
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
    const resolvedParams = await params; // ✅ Await params

    const { id } = resolvedParams;

    // Try to get from cache first
    const cacheKey = `diet-plan:${id}:${user.uid}`;
    const cachedPlan = cache.get(cacheKey);
    if (cachedPlan) {
      return NextResponse.json({
        ...cachedPlan,
        cached: true,
      });
    }

    const dietPlan = await DietPlan.findOne({ _id: id, userId: user.uid });

    if (!dietPlan) {
      return NextResponse.json(
        { message: "Diet plan not found" },
        { status: 404 }
      );
    }

    // Cache the diet plan for 15 minutes
    cache.set(cacheKey, dietPlan, 900); // 15 minutes

    // Use Next.js built-in caching as well
    const response = NextResponse.json(dietPlan);
    response.headers.set('Cache-Control', 's-maxage=900, stale-while-revalidate');
    
    return response;
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/diet-plans/[id] - Update diet plan
export async function PUT(request, { params }) {
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
    const resolvedParams = await params; // ✅ Await params

    // Find and update the diet plan
    const dietPlan = await DietPlan.findOneAndUpdate(
      { _id: resolvedParams.id, userId: user.uid },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!dietPlan) {
      return NextResponse.json(
        { message: "Diet plan not found" },
        { status: 404 }
      );
    }

    // Invalidate cache for this specific diet plan
    const cacheKey = `diet-plan:${resolvedParams.id}:${user.uid}`;
    cache.delete(cacheKey);

    return NextResponse.json(dietPlan);
  } catch (error) {
    console.error("Error updating diet plan:", error);

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

// DELETE /api/diet-plans/[id] - Delete diet plan
export async function DELETE(request, { params }) {
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

    const resolvedParams = await params; // ✅ Await params

    const dietPlan = await DietPlan.findOneAndDelete({
      _id: resolvedParams.id,
      userId: user.uid,
    });

    if (!dietPlan) {
      return NextResponse.json(
        { message: "Diet plan not found" },
        { status: 404 }
      );
    }

    // Invalidate cache for this specific diet plan
    const cacheKey = `diet-plan:${resolvedParams.id}:${user.uid}`;
    cache.delete(cacheKey);

    return NextResponse.json({ message: "Diet plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
