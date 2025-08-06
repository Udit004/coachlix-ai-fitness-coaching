// api/workout-plans/[id]/stats/route.js - Get comprehensive workout plan statistics
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

    // Find the workout plan with all necessary data
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
      planName: plan.name,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching workout stats:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate comprehensive workout statistics
function calculateWorkoutStats(plan) {
  const stats = {
    // Basic plan info
    totalWorkouts: 0,
    totalDuration: 0, // in minutes
    totalCalories: 0,
    averageWorkoutDuration: 0,
    completionRate: 0,
    consistency: 0,
    caloriesBurned: 0,
    strengthGains: 0,
    
    // Weekly breakdown
    weeklyData: [],
    
    // Exercise analytics
    exerciseStats: {
      totalExercises: 0,
      completedExercises: 0,
      totalSets: 0,
      totalReps: 0,
      averageWeight: 0,
      personalRecords: []
    },
    
    // Muscle groups and equipment distribution
    muscleGroupDistribution: {},
    equipmentUsage: {},
    
    // Progress tracking
    progressMetrics: {
      weightProgress: [],
      measurementProgress: {},
      strengthProgress: [],
      consistencyTrend: []
    },
    
    // Achievements and milestones
    achievements: [],
    milestones: []
  };

  if (!plan.weeks || plan.weeks.length === 0) {
    return stats;
  }

  let totalCompletedWorkouts = 0;
  let totalPlannedWorkouts = 0;
  let totalActualDuration = 0;
  let totalEstimatedDuration = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalWeight = 0;
  let weightCount = 0;

  // Process each week
  plan.weeks.forEach((week, weekIndex) => {
    const weekData = {
      week: week.weekNumber || weekIndex + 1,
      workouts: 0,
      completedWorkouts: 0,
      duration: 0,
      completionRate: 0,
      avgWeight: 0,
      avgReps: 0,
      totalCalories: 0
    };

    // Process each day in the week
    week.days?.forEach(day => {
      if (!day.isRestDay && day.workouts) {
        day.workouts.forEach(workout => {
          totalPlannedWorkouts++;
          weekData.workouts++;
          
          // Add estimated duration
          const estimatedDuration = workout.estimatedDuration || 0;
          totalEstimatedDuration += estimatedDuration;

          // Check if workout is completed
          if (workout.isCompleted || workout.completedAt) {
            totalCompletedWorkouts++;
            weekData.completedWorkouts++;
            
            const actualDuration = workout.actualDuration || estimatedDuration;
            totalActualDuration += actualDuration;
            weekData.duration += actualDuration;
            
            if (workout.caloriesBurned) {
              stats.totalCalories += workout.caloriesBurned;
              weekData.totalCalories += workout.caloriesBurned;
            }
          }

          // Process exercises in the workout
          if (workout.exercises) {
            workout.exercises.forEach(exercise => {
              stats.exerciseStats.totalExercises++;
              
              // Count muscle groups
              if (exercise.muscleGroups) {
                exercise.muscleGroups.forEach(group => {
                  stats.muscleGroupDistribution[group] = 
                    (stats.muscleGroupDistribution[group] || 0) + 1;
                });
              }
              
              // Count equipment usage
              if (exercise.equipment) {
                exercise.equipment.forEach(equip => {
                  stats.equipmentUsage[equip] = 
                    (stats.equipmentUsage[equip] || 0) + 1;
                });
              }

              // Process completed exercises
              if (exercise.isCompleted) {
                stats.exerciseStats.completedExercises++;
                
                // Process sets
                if (exercise.sets && exercise.sets.length > 0) {
                  exercise.sets.forEach(set => {
                    if (set.completed) {
                      totalSets++;
                      if (set.reps) totalReps += set.reps;
                      if (set.weight && set.weight > 0) {
                        totalWeight += set.weight;
                        weightCount++;
                      }
                    }
                  });
                }
                
                // Track personal records
                if (exercise.personalRecord) {
                  stats.exerciseStats.personalRecords.push({
                    exercise: exercise.name,
                    weight: exercise.personalRecord.weight,
                    reps: exercise.personalRecord.reps,
                    date: exercise.personalRecord.date
                  });
                }
              }
            });
          }
        });
      }
    });

    // Calculate week completion rate
    weekData.completionRate = weekData.workouts > 0 
      ? Math.round((weekData.completedWorkouts / weekData.workouts) * 100) 
      : 0;
    
    stats.weeklyData.push(weekData);
  });

  // Calculate overall statistics
  stats.totalWorkouts = totalCompletedWorkouts;
  stats.totalDuration = Math.round(totalActualDuration);
  stats.averageWorkoutDuration = totalCompletedWorkouts > 0 
    ? Math.round(totalActualDuration / totalCompletedWorkouts) 
    : 0;
  
  stats.completionRate = totalPlannedWorkouts > 0 
    ? Math.round((totalCompletedWorkouts / totalPlannedWorkouts) * 100) 
    : 0;
  
  stats.consistency = stats.completionRate; // Same as completion rate for now
  stats.caloriesBurned = stats.totalCalories;
  
  // Exercise statistics
  stats.exerciseStats.totalSets = totalSets;
  stats.exerciseStats.totalReps = totalReps;
  stats.exerciseStats.averageWeight = weightCount > 0 
    ? Math.round(totalWeight / weightCount) 
    : 0;

  // Process progress data if available
  if (plan.progress && plan.progress.length > 0) {
    stats.progressMetrics = calculateProgressMetrics(plan.progress);
  }

  // Calculate achievements
  stats.achievements = calculateAchievements(stats, plan);
  
  // Calculate milestones
  stats.milestones = calculateMilestones(stats, plan);

  return stats;
}

// Helper function to calculate progress metrics from progress entries
function calculateProgressMetrics(progressEntries) {
  const metrics = {
    weightProgress: [],
    measurementProgress: {
      chest: [],
      waist: [],
      hips: [],
      arms: [],
      thighs: []
    },
    strengthProgress: [],
    consistencyTrend: []
  };

  // Sort progress entries by date
  const sortedProgress = [...progressEntries].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Process weight progress
  sortedProgress.forEach(entry => {
    if (entry.weight) {
      metrics.weightProgress.push({
        date: entry.date,
        weight: entry.weight
      });
    }
    
    // Process measurements
    if (entry.measurements) {
      Object.keys(entry.measurements).forEach(measurement => {
        if (metrics.measurementProgress[measurement]) {
          metrics.measurementProgress[measurement].push({
            date: entry.date,
            value: entry.measurements[measurement]
          });
        }
      });
    }
  });

  return metrics;
}

// Helper function to calculate achievements
function calculateAchievements(stats, plan) {
  const achievements = [];

  // Basic achievements
  if (stats.totalWorkouts >= 1) {
    achievements.push({
      id: "first_workout",
      title: "First Steps",
      description: "Completed your first workout",
      icon: "🎯",
      earnedAt: new Date(),
      category: "milestone"
    });
  }

  if (stats.totalWorkouts >= 10) {
    achievements.push({
      id: "consistency_10",
      title: "Building Momentum",
      description: "Completed 10 workouts",
      icon: "💪",
      earnedAt: new Date(),
      category: "consistency"
    });
  }

  if (stats.totalWorkouts >= 50) {
    achievements.push({
      id: "consistency_50",
      title: "Dedication Master",
      description: "Completed 50 workouts",
      icon: "🏆",
      earnedAt: new Date(),
      category: "consistency"
    });
  }

  // Consistency achievements
  if (stats.completionRate >= 80) {
    achievements.push({
      id: "high_consistency",
      title: "Consistency Champion",
      description: "Maintaining 80%+ completion rate",
      icon: "⚡",
      earnedAt: new Date(),
      category: "consistency"
    });
  }

  // Strength achievements
  if (stats.exerciseStats.totalSets >= 100) {
    achievements.push({
      id: "sets_100",
      title: "Set Crusher",
      description: "Completed 100+ sets",
      icon: "🔥",
      earnedAt: new Date(),
      category: "strength"
    });
  }

  // Variety achievements
  const muscleGroupCount = Object.keys(stats.muscleGroupDistribution).length;
  if (muscleGroupCount >= 5) {
    achievements.push({
      id: "well_rounded",
      title: "Well-Rounded Athlete",
      description: "Training 5+ muscle groups",
      icon: "🎪",
      earnedAt: new Date(),
      category: "variety"
    });
  }

  return achievements;
}

// Helper function to calculate milestones
function calculateMilestones(stats, plan) {
  const milestones = [];
  
  // Duration milestones
  if (stats.totalDuration >= 600) { // 10 hours
    milestones.push({
      title: "Time Investment",
      description: "10+ hours of training completed",
      progress: Math.min(100, (stats.totalDuration / 600) * 100),
      target: "10 hours",
      current: `${Math.round(stats.totalDuration / 60)} hours`
    });
  }

  // Workout count milestones
  milestones.push({
    title: "Workout Progress",
    description: "Journey to 100 workouts",
    progress: Math.min(100, (stats.totalWorkouts / 100) * 100),
    target: "100 workouts",
    current: `${stats.totalWorkouts} workouts`
  });

  // Consistency milestone
  milestones.push({
    title: "Consistency Goal",
    description: "Maintain 90% completion rate",
    progress: Math.min(100, (stats.completionRate / 90) * 100),
    target: "90% completion",
    current: `${stats.completionRate}% completion`
  });

  return milestones;
}