import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";
import {
  invalidateWorkoutPlanCache,
  recalculatePlanAggregates,
} from "../../../../utils";

const resolveWorkout = (day, workoutId) => {
  const numericWorkoutId = Number.parseInt(workoutId, 10);
  if (!Number.isNaN(numericWorkoutId)) {
    return { workout: day.workouts[numericWorkoutId], workoutIndex: numericWorkoutId };
  }

  const workoutIndex = day.workouts.findIndex(
    (workout) => workout?._id?.toString() === workoutId
  );

  return {
    workout: workoutIndex >= 0 ? day.workouts[workoutIndex] : null,
    workoutIndex,
  };
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

    const {
      id: planId,
      weekNumber,
      dayNumber,
      workoutId,
      exerciseIndex,
    } = await params;

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

    const { workout } = resolveWorkout(day, workoutId);
    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const targetExerciseIndex = Number.parseInt(exerciseIndex, 10);
    if (
      Number.isNaN(targetExerciseIndex) ||
      targetExerciseIndex < 0 ||
      targetExerciseIndex >= workout.exercises.length
    ) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const removedExercise = workout.exercises[targetExerciseIndex];
    workout.exercises.splice(targetExerciseIndex, 1);

    recalculatePlanAggregates(plan);
    await plan.save();
    await invalidateWorkoutPlanCache(user.uid, planId);

    return NextResponse.json({
      success: true,
      message: "Exercise removed successfully",
      removedExerciseName: removedExercise?.name,
      remainingExercises: workout.exercises.length,
    });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return NextResponse.json(
      {
        error: "Failed to delete exercise",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
