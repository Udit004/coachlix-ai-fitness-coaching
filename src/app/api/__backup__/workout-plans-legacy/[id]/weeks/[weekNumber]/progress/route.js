// api/workout-plans/[id]/weeks/[weekNumber]/progress/route.js
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// GET /api/workout-plans/[id]/weeks/[weekNumber]/progress - Get weekly progress data
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id: planId, weekNumber } = resolvedParams;
    
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const plan = await WorkoutPlan.findOne({ _id: planId, userId: user.uid });
    if (!plan) {
      return NextResponse.json({ message: "Workout plan not found" }, { status: 404 });
    }

    const week = plan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return NextResponse.json({ message: "Week not found" }, { status: 404 });
    }

    // Calculate weekly statistics
    const weeklyStats = calculateWeeklyStats(week, plan);

    return NextResponse.json({
      success: true,
      weekNumber: parseInt(weekNumber),
      weeklyStats,
      week: {
        weekNumber: week.weekNumber,
        days: week.days,
        weeklyGoal: week.weeklyGoal,
        completed: week.completed,
        totalWorkouts: week.totalWorkouts,
        totalDuration: week.totalDuration
      }
    });

  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

function calculateWeeklyStats(week, plan) {
  const stats = {
    totalWorkouts: 0,
    completedWorkouts: 0,
    totalExercises: 0,
    completedExercises: 0,
    totalSets: 0,
    completedSets: 0,
    totalDuration: 0,
    totalCalories: 0,
    dailyBreakdown: [],
    exerciseBreakdown: {},
    muscleGroupsTargeted: new Set(),
    averageWorkoutDuration: 0,
    completionRate: 0
  };

  week.days.forEach(day => {
    const dayStats = {
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      isRestDay: day.isRestDay,
      workouts: 0,
      completedWorkouts: 0,
      exercises: 0,
      completedExercises: 0,
      duration: 0,
      calories: 0
    };

    if (!day.isRestDay && day.workouts) {
      day.workouts.forEach(workout => {
        stats.totalWorkouts++;
        dayStats.workouts++;

        if (workout.isCompleted) {
          stats.completedWorkouts++;
          dayStats.completedWorkouts++;
        }

        dayStats.duration += workout.actualDuration || workout.estimatedDuration || 0;
        dayStats.calories += workout.caloriesBurned || 0;

        workout.exercises?.forEach(exercise => {
          stats.totalExercises++;
          dayStats.exercises++;

          // Track exercise types
          if (!stats.exerciseBreakdown[exercise.name]) {
            stats.exerciseBreakdown[exercise.name] = { total: 0, completed: 0 };
          }
          stats.exerciseBreakdown[exercise.name].total++;

          // Track muscle groups
          exercise.muscleGroups?.forEach(muscle => {
            stats.muscleGroupsTargeted.add(muscle);
          });

          if (exercise.isCompleted) {
            stats.completedExercises++;
            dayStats.completedExercises++;
            stats.exerciseBreakdown[exercise.name].completed++;
          }

          // Count sets
          if (exercise.sets && exercise.sets.length > 0) {
            stats.totalSets += exercise.sets.length;
            const completedSetsCount = exercise.sets.filter(set => set.completed).length;
            stats.completedSets += completedSetsCount;
          }
        });
      });
    }

    stats.totalDuration += dayStats.duration;
    stats.totalCalories += dayStats.calories;
    stats.dailyBreakdown.push(dayStats);
  });

  // Calculate averages and rates
  stats.averageWorkoutDuration = stats.completedWorkouts > 0 
    ? Math.round(stats.totalDuration / stats.completedWorkouts) 
    : 0;

  stats.completionRate = stats.totalWorkouts > 0 
    ? Math.round((stats.completedWorkouts / stats.totalWorkouts) * 100) 
    : 0;

  // Convert Set to Array for JSON serialization
  stats.muscleGroupsTargeted = Array.from(stats.muscleGroupsTargeted);

  return stats;
}