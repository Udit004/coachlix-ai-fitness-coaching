import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import { invalidateWorkoutPlanCache, recalculatePlanAggregates } from "./utils";

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const authHeader =
      request.headers.get("Authorization") || request.headers.get("authorization");
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

    const { id: planId, weekNumber, dayNumber } = await params;

    const plan = await WorkoutPlan.findOne({ _id: planId, userId: user.uid });
    if (!plan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 });
    }

    const week = plan.weeks.find((w) => w.weekNumber === Number.parseInt(weekNumber, 10));
    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const day = week.days.find((d) => d.dayNumber === Number.parseInt(dayNumber, 10));
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const removedWorkouts = day.workouts.length;
    day.workouts = [];
    day.isRestDay = true;
    day.totalDuration = 0;
    day.totalCaloriesBurned = 0;
    day.notes = day.notes || "Day cleared by user";

    recalculatePlanAggregates(plan);
    await plan.save();
    await invalidateWorkoutPlanCache(user.uid, planId);

    return NextResponse.json({
      success: true,
      message: "Day cleared successfully",
      removedWorkouts,
    });
  } catch (error) {
    console.error("Error clearing day workouts:", error);
    return NextResponse.json(
      { error: "Failed to clear day", details: error.message },
      { status: 500 }
    );
  }
}
