// api/diet-plans/[id]/route.js - Single diet plan operations with caching
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import User from "@/models/userProfileModel";
import { NotificationService } from "@/lib/notificationService";
// Disabled simple in-memory cache for per-user plans to avoid stale reads across serverless instances

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

    // Bypass server-side in-memory caching to ensure fresh data per request

    const dietPlan = await DietPlan.findOne({ _id: id, userId: user.uid });

    if (!dietPlan) {
      return NextResponse.json(
        { message: "Diet plan not found" },
        { status: 404 }
      );
    }

    const plainPlan = dietPlan.toObject();
    const response = NextResponse.json(plainPlan);
    // Ensure no HTTP-level caching for authenticated resources
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
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

    // Notify user on update
    try {
      const userDoc = await User.findOne({ firebaseUid: user.uid });
      if (userDoc?.pushToken) {
        await NotificationService.sendCustomNotification(
          userDoc.pushToken,
          "Diet Plan Updated 📝",
          `Your plan "${dietPlan.name}" was updated successfully.`,
          {
            type: "diet_plan_updated",
            planId: dietPlan._id.toString(),
            planName: dietPlan.name,
          }
        );
      }
    } catch (notifyError) {
      console.error("Failed to send update notification:", notifyError);
    }

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

    // Notify user on deletion
    try {
      const userDoc = await User.findOne({ firebaseUid: user.uid });
      if (userDoc?.pushToken) {
        await NotificationService.sendCustomNotification(
          userDoc.pushToken,
          "Diet Plan Deleted 🗑️",
          `Your plan "${dietPlan.name}" was deleted.`,
          {
            type: "diet_plan_deleted",
            planName: dietPlan.name,
          }
        );
      }
    } catch (notifyError) {
      console.error("Failed to send delete notification:", notifyError);
    }

    // No server-side in-memory cache to invalidate

    return NextResponse.json({ message: "Diet plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
