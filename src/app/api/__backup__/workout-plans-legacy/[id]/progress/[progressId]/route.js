// api/workout-plans/[id]/progress/[progressId]/route.js - Update or delete specific progress entry
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// PUT /api/workout-plans/[id]/progress/[progressId] - Update specific progress entry
export async function PUT(request, { params }) {
  try {
    const { id: planId, progressId } = params;
    
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
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Update data is required" },
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

    // Find the progress entry to update
    const progressEntryIndex = plan.progress.findIndex(
      entry => entry._id.toString() === progressId
    );

    if (progressEntryIndex === -1) {
      return NextResponse.json(
        { message: "Progress entry not found" },
        { status: 404 }
      );
    }

    // Update progress entry with validation
    const currentEntry = plan.progress[progressEntryIndex];
    const updatedEntry = { ...currentEntry.toObject() };

    // Update fields if provided
    if (body.date) {
      updatedEntry.date = new Date(body.date);
    }
    
    if (body.weight !== undefined) {
      updatedEntry.weight = body.weight > 0 ? Number(body.weight) : undefined;
    }
    
    if (body.bodyFat !== undefined) {
      updatedEntry.bodyFat = (body.bodyFat >= 0 && body.bodyFat <= 100) 
        ? Number(body.bodyFat) 
        : undefined;
    }

    if (body.measurements) {
      updatedEntry.measurements = updatedEntry.measurements || {};
      const validMeasurements = ['chest', 'waist', 'hips', 'arms', 'thighs'];
      validMeasurements.forEach(measurement => {
        if (body.measurements[measurement] !== undefined) {
          if (body.measurements[measurement] > 0) {
            updatedEntry.measurements[measurement] = Number(body.measurements[measurement]);
          } else {
            delete updatedEntry.measurements[measurement];
          }
        }
      });
    }

    if (body.photos) {
      updatedEntry.photos = Array.isArray(body.photos) 
        ? body.photos.filter(photo => 
            photo.url && 
            ['front', 'side', 'back'].includes(photo.type) &&
            typeof photo.url === 'string'
          )
        : [];
    }

    if (body.notes !== undefined) {
      updatedEntry.notes = body.notes ? String(body.notes).trim() : undefined;
    }

    // Replace the progress entry
    plan.progress[progressEntryIndex] = updatedEntry;
    
    // Save the updated plan
    await plan.save();

    return NextResponse.json({
      success: true,
      message: "Progress entry updated successfully",
      progressEntry: updatedEntry,
      planId: planId
    });
    
  } catch (error) {
    console.error("Error updating progress entry:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/workout-plans/[id]/progress/[progressId] - Delete specific progress entry
export async function DELETE(request, { params }) {
  try {
    const { id: planId, progressId } = params;
    
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
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Find and remove the progress entry
    const progressEntryIndex = plan.progress.findIndex(
      entry => entry._id.toString() === progressId
    );

    if (progressEntryIndex === -1) {
      return NextResponse.json(
        { message: "Progress entry not found" },
        { status: 404 }
      );
    }

    // Remove the progress entry
    const deletedEntry = plan.progress[progressEntryIndex];
    plan.progress.splice(progressEntryIndex, 1);
    
    // Save the updated plan
    await plan.save();

    return NextResponse.json({
      success: true,
      message: "Progress entry deleted successfully",
      deletedEntry: {
        _id: deletedEntry._id,
        date: deletedEntry.date
      },
      remainingEntries: plan.progress.length,
      planId: planId
    });
    
  } catch (error) {
    console.error("Error deleting progress entry:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/workout-plans/[id]/progress/[progressId] - Get specific progress entry
export async function GET(request, { params }) {
  try {
    const { id: planId, progressId } = params;
    
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

    // Find the specific progress entry
    const progressEntry = plan.progress.find(
      entry => entry._id.toString() === progressId
    );

    if (!progressEntry) {
      return NextResponse.json(
        { message: "Progress entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      progressEntry,
      planId: planId,
      planName: plan.name
    });
    
  } catch (error) {
    console.error("Error fetching progress entry:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}