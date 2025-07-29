// api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/complete/route.js
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";

// POST /api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/complete
export async function POST(request, { params }) {
  try {
    // Await params before destructuring
    const { 
      id: planId, 
      weekNumber, 
      dayNumber, 
      workoutId 
    } = await params;
    
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

    const sessionData = await request.json();

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

    // Find the specific day
    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return NextResponse.json(
        { message: "Day not found" },
        { status: 404 }
      );
    }

    // Find the specific workout
    const workout = day.workouts.find(w => w.id === workoutId || w._id?.toString() === workoutId);
    if (!workout) {
      return NextResponse.json(
        { message: "Workout not found" },
        { status: 404 }
      );
    }

    // Complete the workout session
    const endTime = new Date();
    const duration = sessionData.duration || (workout.startedAt ? Math.floor((endTime - new Date(workout.startedAt)) / 1000 / 60) : 0);
    
    // Update workout status
    workout.status = 'completed';
    workout.completed = true;
    workout.completedAt = endTime;
    workout.actualDuration = duration;
    workout.completionData = {
      totalExercises: sessionData.totalExercises || workout.exercises?.length || 0,
      completedExercises: sessionData.completedExercises || 0,
      totalSets: sessionData.totalSets || 0,
      averageIntensity: sessionData.averageIntensity || workout.intensity || 0,
      notes: sessionData.notes || ''
    };

    // Update exercise completion data if provided
    if (sessionData.exercises) {
      sessionData.exercises.forEach((exerciseData, index) => {
        if (workout.exercises && workout.exercises[index]) {
          workout.exercises[index].completed = exerciseData.completed || false;
          workout.exercises[index].actualSets = exerciseData.actualSets;
          workout.exercises[index].actualReps = exerciseData.actualReps;
          workout.exercises[index].actualWeight = exerciseData.actualWeight;
          workout.exercises[index].notes = exerciseData.notes;
        }
      });
    }

    // Save the updated plan
    await plan.save();

    // Send notification for workout completion
    try {
      const userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Workout Completed! 🎉",
          `Great job! You completed "${workout.name}" in ${duration} minutes.`,
          {
            type: "workout_completed",
            planId: planId,
            workoutId: workoutId,
            workoutName: workout.name,
            duration: duration,
            weekNumber: weekNumber,
            dayNumber: dayNumber
          }
        );
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "workout_completed",
                  description: `Completed workout: ${workout.name}`,
                  timestamp: new Date(),
                  details: {
                    workoutName: workout.name,
                    planName: plan.name,
                    duration: duration,
                    weekNumber: weekNumber,
                    dayNumber: dayNumber
                  }
                }],
                $slice: -10,
              },
            },
          }
        );
      }
    } catch (notificationError) {
      console.error("Failed to send workout completion notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Workout session completed successfully",
      completion: {
        workoutId: workoutId,
        planId: planId,
        weekNumber: weekNumber,
        dayNumber: dayNumber,
        completedAt: endTime,
        duration: duration,
        status: 'completed'
      },
      workout: workout
    });
    
  } catch (error) {
    console.error("Error completing workout session:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}