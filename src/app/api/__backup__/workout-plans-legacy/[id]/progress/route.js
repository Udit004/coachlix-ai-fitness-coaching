// api/workout-plans/[id]/progress/route.js - Enhanced with debugging
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// GET /api/workout-plans/[id]/progress - Get progress history
export async function GET(request, { params }) {
  try {
    console.log("📥 GET Progress - Starting request");
    
    // FIXED: Await params before accessing properties
    const resolvedParams = await params;
    const { id: planId } = resolvedParams;
    console.log("🆔 Plan ID:", planId);
    
    // Verify authentication
    const authHeader =
      request.headers.get("Authorization") ||
      request.headers.get("authorization");
    
    console.log("🔑 Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("❌ No auth header");
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const user = await verifyUserToken(authHeader);
    console.log("👤 User verified:", !!user, user?.uid);
    
    if (!user) {
      console.log("❌ User verification failed");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    console.log("📊 DB connected");

    // Find the workout plan
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.uid
    }).select('progress name');

    console.log("📋 Plan found:", !!plan, plan?.name);

    if (!plan) {
      console.log("❌ Plan not found");
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Sort progress entries by date (newest first)
    const progress = plan.progress?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];
    console.log("📈 Progress entries:", progress.length);

    return NextResponse.json({
      success: true,
      progress,
      planId: planId,
      planName: plan.name,
      totalEntries: progress.length
    });
    
  } catch (error) {
    console.error("❌ GET Progress Error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workout-plans/[id]/progress - Add new progress entry
export async function POST(request, { params }) {
  console.log("📥 POST Progress - Starting request");
  
  try {
    // FIXED: Await params before accessing properties
    const resolvedParams = await params;
    const { id: planId } = resolvedParams;
    console.log("🆔 Plan ID:", planId);
    
    // Verify authentication
    const authHeader =
      request.headers.get("Authorization") ||
      request.headers.get("authorization");
    
    console.log("🔑 Auth header present:", !!authHeader);
    console.log("🔑 Auth header value:", authHeader?.substring(0, 20) + "...");
    
    if (!authHeader) {
      console.log("❌ No auth header - returning 401");
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    console.log("👤 Verifying user token...");
    const user = await verifyUserToken(authHeader);
    console.log("👤 User verification result:", !!user, user?.uid);
    
    if (!user) {
      console.log("❌ User verification failed - returning 401");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("📄 Parsing request body...");
    let body;
    try {
      body = await request.json();
      console.log("📄 Request body:", JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error("❌ JSON parsing error:", jsonError);
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body || Object.keys(body).length === 0) {
      console.log("❌ Empty or missing body - returning 400");
      return NextResponse.json(
        { message: "Progress data is required" },
        { status: 400 }
      );
    }

    console.log("📊 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    console.log("🔍 Finding workout plan...");
    // Find the workout plan
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.uid
    });

    console.log("📋 Plan query result:", !!plan, plan?._id);

    if (!plan) {
      console.log("❌ Plan not found - returning 404");
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("🏗️ Creating progress entry...");
    // Create progress entry with validation
    const progressEntry = {
      date: body.date || new Date(),
      weight: body.weight && body.weight > 0 ? Number(body.weight) : undefined,
      bodyFat: body.bodyFat && body.bodyFat >= 0 && body.bodyFat <= 100 ? Number(body.bodyFat) : undefined,
      measurements: {},
      photos: body.photos || [],
      notes: body.notes ? String(body.notes).trim() : undefined
    };

    console.log("📏 Processing measurements...");
    // Validate and add measurements
    if (body.measurements) {
      const validMeasurements = ['chest', 'waist', 'hips', 'arms', 'thighs'];
      validMeasurements.forEach(measurement => {
        if (body.measurements[measurement] && body.measurements[measurement] > 0) {
          progressEntry.measurements[measurement] = Number(body.measurements[measurement]);
        }
      });
    }

    console.log("📸 Processing photos...");
    // Validate photos if provided
    if (body.photos && Array.isArray(body.photos)) {
      progressEntry.photos = body.photos.filter(photo => {
        return photo.url && 
               ['front', 'side', 'back'].includes(photo.type) &&
               typeof photo.url === 'string';
      });
    }

    console.log("💾 Final progress entry:", JSON.stringify(progressEntry, null, 2));

    console.log("💾 Saving progress entry to plan...");
    // Add progress entry using the schema method
    await plan.addProgressEntry(progressEntry);
    console.log("✅ Progress entry saved");

    console.log("📊 Fetching updated plan stats...");
    // Calculate updated statistics after adding progress
    const updatedPlan = await WorkoutPlan.findById(planId).select('progress stats');
    console.log("📊 Updated plan progress count:", updatedPlan.progress.length);
    
    const response = {
      success: true,
      message: "Progress entry added successfully",
      progressEntry,
      totalEntries: updatedPlan.progress.length,
      planId: planId
    };

    console.log("✅ Returning success response");
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error("❌ POST Progress Error Details:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    
    // Return more specific error information
    return NextResponse.json(
      { 
        message: "Internal server error", 
        error: error.message,
        errorType: error.name
      },
      { status: 500 }
    );
  }
}