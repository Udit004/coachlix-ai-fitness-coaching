import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import {
  invalidateWorkoutPlanCache,
  recalculatePlanAggregates,
} from "../../utils";

const resolveWorkoutIndex = (day, workoutId) => {
  const numericWorkoutId = Number.parseInt(workoutId, 10);
  if (!Number.isNaN(numericWorkoutId)) {
    return numericWorkoutId;
  }

  return day.workouts.findIndex((workout) => workout?._id?.toString() === workoutId);
};

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

    const { id: planId, weekNumber, dayNumber, workoutId } = await params;

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

    const workoutIndex = resolveWorkoutIndex(day, workoutId);
    if (workoutIndex < 0 || workoutIndex >= day.workouts.length) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const [removedWorkout] = day.workouts.splice(workoutIndex, 1);

    if (day.workouts.length === 0) {
      day.isRestDay = true;
      day.notes = day.notes || "No workouts assigned";
    }

    recalculatePlanAggregates(plan);
    await plan.save();
    await invalidateWorkoutPlanCache(user.uid, planId);

    return NextResponse.json({
      success: true,
      message: "Workout removed successfully",
      removedWorkoutName: removedWorkout?.name,
      remainingWorkouts: day.workouts.length,
      isRestDay: day.isRestDay,
    });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return NextResponse.json(
      { error: "Failed to delete workout", details: error.message },
      { status: 500 }
    );
  }
}
