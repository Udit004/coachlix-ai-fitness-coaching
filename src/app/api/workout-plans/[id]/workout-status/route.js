// api/workout-plans/[id]/workout-status/route.js - Update workout completion status
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// PUT /api/workout-plans/[id]/workout-status - Update workout completion status
export async function PUT(request, { params }) {
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
    const { weekNumber, dayNumber, workoutIndex, status, completedAt, actualDuration, caloriesBurned, notes } = body;
    
    // Validate required fields
    if (!weekNumber || !dayNumber || workoutIndex === undefined || !status) {
      return NextResponse.json(
        { message: "weekNumber, dayNumber, workoutIndex, and status are required" },
        { status: 400 }
      );
    }

    if (!['pending', 'in-progress', 'completed', 'skipped'].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be one of: pending, in-progress, completed, skipped" },
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

    // Find the specific workout
    const week = plan.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) {
      return NextResponse.json(
        { message: "Week not found" },
        { status: 404 }
      );
    }

    const day = week.days.find(d => d.dayNumber === dayNumber);
    if (!day) {
      return NextResponse.json(
        { message: "Day not found" },
        { status: 404 }
      );
    }

    if (!day.workouts || !day.workouts[workoutIndex]) {
      return NextResponse.json(
        { message: "Workout not found" },
        { status: 404 }
      );
    }

    const workout = day.workouts[workoutIndex];

    // Update workout status and related fields
    workout.isCompleted = status === 'completed';
    workout.status = status;
    
    if (status === 'completed') {
      workout.completedAt = completedAt ? new Date(completedAt) : new Date();
      if (actualDuration) workout.actualDuration = actualDuration;
      if (caloriesBurned) workout.caloriesBurned = caloriesBurned;
    } else {
      workout.completedAt = null;
    }
    
    if (notes) workout.notes = notes;

    // Save the updated plan
    await plan.save();

    return NextResponse.json({
      success: true,
      message: `Workout ${status} successfully`,
      workout: {
        weekNumber,
        dayNumber,
        workoutIndex,
        name: workout.name,
        status: workout.status,
        isCompleted: workout.isCompleted,
        completedAt: workout.completedAt,
        actualDuration: workout.actualDuration,
        caloriesBurned: workout.caloriesBurned
      }
    });
    
  } catch (error) {
    console.error("Error updating workout status:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// =================== EXERCISE PROGRESS ROUTE ===================

// api/workout-plans/[id]/exercise-progress/route.js - Update exercise progress and sets
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
    const { 
      weekNumber, 
      dayNumber, 
      workoutIndex, 
      exerciseIndex, 
      isCompleted,
      sets,
      personalRecord,
      notes 
    } = body;
    
    // Validate required fields
    if (!weekNumber || !dayNumber || workoutIndex === undefined || exerciseIndex === undefined) {
      return NextResponse.json(
        { message: "weekNumber, dayNumber, workoutIndex, and exerciseIndex are required" },
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

    // Navigate to the specific exercise
    const week = plan.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) {
      return NextResponse.json(
        { message: "Week not found" },
        { status: 404 }
      );
    }

    const day = week.days.find(d => d.dayNumber === dayNumber);
    if (!day) {
      return NextResponse.json(
        { message: "Day not found" },
        { status: 404 }
      );
    }

    const workout = day.workouts?.[workoutIndex];
    if (!workout) {
      return NextResponse.json(
        { message: "Workout not found" },
        { status: 404 }
      );
    }

    const exercise = workout.exercises?.[exerciseIndex];
    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found" },
        { status: 404 }
      );
    }

    // Update exercise data
    if (isCompleted !== undefined) {
      exercise.isCompleted = isCompleted;
    }

    if (sets && Array.isArray(sets)) {
      // Validate and update sets
      exercise.sets = sets.map(set => ({
        reps: set.reps || 0,
        weight: set.weight || 0,
        duration: set.duration || 0,
        distance: set.distance || 0,
        restTime: set.restTime || 60,
        completed: set.completed || false,
        notes: set.notes || ""
      }));
    }

    if (personalRecord) {
      exercise.personalRecord = {
        weight: personalRecord.weight || 0,
        reps: personalRecord.reps || 0,
        date: personalRecord.date ? new Date(personalRecord.date) : new Date()
      };
    }

    if (notes !== undefined) {
      exercise.notes = notes;
    }

    // Save the updated plan
    await plan.save();

    return NextResponse.json({
      success: true,
      message: "Exercise progress updated successfully",
      exercise: {
        name: exercise.name,
        isCompleted: exercise.isCompleted,
        sets: exercise.sets,
        personalRecord: exercise.personalRecord,
        notes: exercise.notes
      }
    });
    
  } catch (error) {
    console.error("Error updating exercise progress:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// =================== WEEKLY PROGRESS ROUTE ===================

// api/workout-plans/[id]/weeks/[weekNumber]/progress/route.js - Get weekly progress
export async function GET(request, { params }) {
  try {
    const { id: planId, weekNumber } = params;
    
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

    // Find the specific week
    const week = plan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return NextResponse.json(
        { message: "Week not found" },
        { status: 404 }
      );
    }

    // Calculate week progress
    const weekProgress = calculateWeekProgress(week);

    return NextResponse.json({
      success: true,
      weekNumber: parseInt(weekNumber),
      progress: weekProgress,
      planId: planId
    });
    
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate week progress
function calculateWeekProgress(week) {
  let totalWorkouts = 0;
  let completedWorkouts = 0;
  let totalExercises = 0;
  let completedExercises = 0;
  let totalSets = 0;
  let completedSets = 0;
  let totalDuration = 0;
  let totalCalories = 0;

  week.days?.forEach(day => {
    if (!day.isRestDay && day.workouts) {
      day.workouts.forEach(workout => {
        totalWorkouts++;
        if (workout.isCompleted) {
          completedWorkouts++;
          totalDuration += workout.actualDuration || workout.estimatedDuration || 0;
          totalCalories += workout.caloriesBurned || 0;
        }

        workout.exercises?.forEach(exercise => {
          totalExercises++;
          if (exercise.isCompleted) {
            completedExercises++;
          }

          exercise.sets?.forEach(set => {
            totalSets++;
            if (set.completed) {
              completedSets++;
            }
          });
        });
      });
    }
  });

  return {
    workouts: {
      total: totalWorkouts,
      completed: completedWorkouts,
      completionRate: totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
    },
    exercises: {
      total: totalExercises,
      completed: completedExercises,
      completionRate: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0
    },
    sets: {
      total: totalSets,
      completed: completedSets,
      completionRate: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
    },
    duration: Math.round(totalDuration),
    calories: totalCalories,
    days: week.days?.map(day => ({
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      isRestDay: day.isRestDay,
      workoutCount: day.workouts?.length || 0,
      completedWorkouts: day.workouts?.filter(w => w.isCompleted).length || 0
    })) || []
  };
}