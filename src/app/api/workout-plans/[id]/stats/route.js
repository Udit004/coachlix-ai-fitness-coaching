// api/workout-plans/[id]/stats/route.js - Get workout plan statistics
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// GET /api/workout-plans/[id]/stats - Get workout statistics
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
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate comprehensive statistics
    const stats = calculateWorkoutStats(plan);

    return NextResponse.json({
      success: true,
      stats,
      planId: planId,
      planName: plan.name
    });
    
  } catch (error) {
    console.error("Error fetching workout stats:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate workout statistics
function calculateWorkoutStats(plan) {
  const stats = {
    overview: {
      totalWeeks: plan.weeks?.length || 0,
      totalWorkouts: 0,
      totalExercises: 0,
      estimatedDuration: 0,
      workoutFrequency: plan.workoutFrequency || 0,
      difficulty: plan.difficulty,
      goal: plan.goal
    },
    progress: {
      completedWorkouts: 0,
      completedExercises: 0,
      totalSets: 0,
      totalReps: 0,
      averageIntensity: 0,
      consistencyRate: 0
    },
    muscleGroups: {},
    equipment: {},
    weeklyBreakdown: [],
    achievements: [],
    recommendations: []
  };

  if (!plan.weeks || plan.weeks.length === 0) {
    return stats;
  }

  let totalIntensity = 0;
  let intensityCount = 0;
  let totalCompletedWorkouts = 0;
  let totalCompletedExercises = 0;
  let totalSets = 0;
  let totalReps = 0;

  // Process each week
  plan.weeks.forEach((week, weekIndex) => {
    const weekStats = {
      weekNumber: week.weekNumber || weekIndex + 1,
      theme: week.theme || 'Training Week',
      totalWorkouts: 0,
      completedWorkouts: 0,
      totalExercises: 0,
      completedExercises: 0,
      estimatedDuration: 0,
      actualDuration: 0
    };

    // Process each day
    week.days?.forEach(day => {
      day.workouts?.forEach(workout => {
        stats.overview.totalWorkouts++;
        weekStats.totalWorkouts++;
        
        if (workout.duration) {
          stats.overview.estimatedDuration += workout.duration;
          weekStats.estimatedDuration += workout.duration;
        }

        if (workout.intensity) {
          totalIntensity += workout.intensity;
          intensityCount++;
        }

        // Check if workout is completed
        if (workout.completed || workout.status === 'completed') {
          totalCompletedWorkouts++;
          weekStats.completedWorkouts++;
          
          if (workout.actualDuration) {
            weekStats.actualDuration += workout.actualDuration;
          }
        }

        // Process exercises
        workout.exercises?.forEach(exercise => {
          stats.overview.totalExercises++;
          weekStats.totalExercises++;

          // Count muscle groups
          exercise.muscleGroups?.forEach(group => {
            stats.muscleGroups[group] = (stats.muscleGroups[group] || 0) + 1;
          });

          // Count equipment
          if (exercise.equipment) {
            stats.equipment[exercise.equipment] = (stats.equipment[exercise.equipment] || 0) + 1;
          }

          // Count sets and reps if exercise is completed
          if (exercise.completed || exercise.status === 'completed') {
            totalCompletedExercises++;
            weekStats.completedExercises++;

            if (exercise.sets) {
              totalSets += exercise.sets;
            }
            
            if (exercise.actualReps) {
              totalReps += exercise.actualReps;
            } else if (exercise.reps && !isNaN(parseInt(exercise.reps))) {
              totalReps += parseInt(exercise.reps) * (exercise.sets || 1);
            }
          }
        });
      });
    });

    stats.weeklyBreakdown.push(weekStats);
  });

  // Calculate averages and percentages
  stats.progress.completedWorkouts = totalCompletedWorkouts;
  stats.progress.completedExercises = totalCompletedExercises;
  stats.progress.totalSets = totalSets;
  stats.progress.totalReps = totalReps;
  stats.progress.averageIntensity = intensityCount > 0 ? Math.round(totalIntensity / intensityCount) : 0;
  stats.progress.consistencyRate = stats.overview.totalWorkouts > 0 
    ? Math.round((totalCompletedWorkouts / stats.overview.totalWorkouts) * 100) 
    : 0;

  // Calculate achievements
  stats.achievements = calculateAchievements(stats);

  // Generate recommendations
  stats.recommendations = generateRecommendations(stats, plan);

  return stats;
}

// Helper function to calculate achievements
function calculateAchievements(stats) {
  const achievements = [];

  if (stats.progress.completedWorkouts >= 1) {
    achievements.push({
      title: "First Workout Complete!",
      description: "You've completed your first workout",
      icon: "🎯",
      unlockedAt: new Date()
    });
  }

  if (stats.progress.completedWorkouts >= 10) {
    achievements.push({
      title: "Consistency Champion",
      description: "10 workouts completed",
      icon: "🏆",
      unlockedAt: new Date()
    });
  }

  if (stats.progress.consistencyRate >= 80) {
    achievements.push({
      title: "Dedication Master",
      description: "Maintaining 80%+ consistency",
      icon: "💪",
      unlockedAt: new Date()
    });
  }

  if (stats.progress.totalSets >= 100) {
    achievements.push({
      title: "Set Crusher",
      description: "100+ sets completed",
      icon: "🔥",
      unlockedAt: new Date()
    });
  }

  const muscleGroupCount = Object.keys(stats.muscleGroups).length;
  if (muscleGroupCount >= 5) {
    achievements.push({
      title: "Well-Rounded Athlete",
      description: "Training 5+ muscle groups",
      icon: "⚡",
      unlockedAt: new Date()
    });
  }

  return achievements;
}

// Helper function to generate recommendations
function generateRecommendations(stats, plan) {
  const recommendations = [];

  // Consistency recommendations
  if (stats.progress.consistencyRate < 50) {
    recommendations.push({
      type: "consistency",
      title: "Improve Consistency",
      message: "Try to maintain at least 3 workouts per week for better results",
      priority: "high"
    });
  }

  // Intensity recommendations
  if (stats.progress.averageIntensity < 60) {
    recommendations.push({
      type: "intensity",
      title: "Increase Intensity",
      message: "Consider increasing workout intensity for better progress",
      priority: "medium"
    });
  }

  // Muscle group balance
  const muscleGroups = Object.keys(stats.muscleGroups);
  if (muscleGroups.length < 3) {
    recommendations.push({
      type: "variety",
      title: "Add Variety",
      message: "Include more muscle groups for balanced development",
      priority: "medium"
    });
  }

  // Progress recommendations
  if (stats.progress.completedWorkouts === 0) {
    recommendations.push({
      type: "motivation",
      title: "Get Started!",
      message: "Complete your first workout to begin your fitness journey",
      priority: "high"
    });
  }

  // Equipment recommendations
  const equipmentCount = Object.keys(stats.equipment).length;
  if (equipmentCount === 0) {
    recommendations.push({
      type: "equipment",
      title: "Consider Equipment",
      message: "Adding basic equipment can increase workout variety",
      priority: "low"
    });
  }

  return recommendations;
}