// api/diet-plans/route.js - Main diet plans endpoint
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

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

    return NextResponse.json({
      success: true,
      plans,
      count: plans.length,
    });
  } catch (error) {
    console.error("Error fetching diet plans:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/diet-plans - Create new diet plan
// POST /api/diet-plans - Create new diet plan
export async function POST(request) {
  try {
    // Verify authentication - FIXED: Extract auth header first
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
      days: body.days || [],
      difficulty: body.difficulty || "Beginner",
      tags: body.tags || [],
      createdBy: body.createdBy || "user",
    });

    const savedPlan = await dietPlan.save();

    return NextResponse.json(savedPlan, { status: 201 });
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