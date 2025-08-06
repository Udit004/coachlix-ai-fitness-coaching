// api/workout-plans/[id]/progress/route.js - Manage workout plan progress entries
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// GET /api/workout-plans/[id]/progress - Get progress history
export async function GET(request, { params }) {
  try {
    const { id: planId } = params;
    
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

    // Find the workout plan
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.uid
    }).select('progress name');

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Sort progress entries by date (newest first)
    const progress = plan.progress?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

    return NextResponse.json({
      success: true,
      progress,
      planId: planId,
      planName: plan.name,
      totalEntries: progress.length
    });
    
  } catch (error) {
    console.error("Error fetching progress history:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workout-plans/[id]/progress - Add new progress entry
export async function POST(request, { params }) {
  try {
    const { id: planId } = params;
    
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

    const body = await request.json();
    
    // Validate required fields
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Progress data is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the workout plan
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.uid
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create progress entry with validation
    const progressEntry = {
      date: body.date || new Date(),
      weight: body.weight && body.weight > 0 ? Number(body.weight) : undefined,
      bodyFat: body.bodyFat && body.bodyFat >= 0 && body.bodyFat <= 100 ? Number(body.bodyFat) : undefined,
      measurements: {},
      photos: body.photos || [],
      notes: body.notes ? String(body.notes).trim() : undefined
    };

    // Validate and add measurements
    if (body.measurements) {
      const validMeasurements = ['chest', 'waist', 'hips', 'arms', 'thighs'];
      validMeasurements.forEach(measurement => {
        if (body.measurements[measurement] && body.measurements[measurement] > 0) {
          progressEntry.measurements[measurement] = Number(body.measurements[measurement]);
        }
      });
    }

    // Validate photos if provided
    if (body.photos && Array.isArray(body.photos)) {
      progressEntry.photos = body.photos.filter(photo => {
        return photo.url && 
               ['front', 'side', 'back'].includes(photo.type) &&
               typeof photo.url === 'string';
      });
    }

    // Add progress entry using the schema method
    await plan.addProgressEntry(progressEntry);

    // Calculate updated statistics after adding progress
    const updatedPlan = await WorkoutPlan.findById(planId).select('progress stats');
    
    return NextResponse.json({
      success: true,
      message: "Progress entry added successfully",
      progressEntry,
      totalEntries: updatedPlan.progress.length,
      planId: planId
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error adding progress entry:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}