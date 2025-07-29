// api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/start/route.js
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";

// POST /api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/start
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

    console.log("🏋️ Starting workout session with params:", {
      planId,
      weekNumber: parseInt(weekNumber),
      dayNumber: parseInt(dayNumber),
      workoutId
    });

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
      console.log("❌ Week not found. Available weeks:", plan.weeks.map(w => w.weekNumber));
      return NextResponse.json(
        { 
          message: "Week not found",
          debug: {
            requestedWeek: parseInt(weekNumber),
            availableWeeks: plan.weeks.map(w => w.weekNumber)
          }
        },
        { status: 404 }
      );
    }

    // Find the specific day
    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log("❌ Day not found. Available days:", week.days.map(d => d.dayNumber));
      return NextResponse.json(
        { 
          message: "Day not found",
          debug: {
            requestedDay: parseInt(dayNumber),
            availableDays: week.days.map(d => d.dayNumber)
          }
        },
        { status: 404 }
      );
    }

    console.log("📅 Found day with workouts:", day.workouts.length);

    // Find the specific workout - handle both index-based and ID-based lookups
    let workout;
    
    // First try to find by ID or _id
    workout = day.workouts.find(w => 
      w.id === workoutId || 
      w._id?.toString() === workoutId ||
      w.id === parseInt(workoutId) ||
      w._id === parseInt(workoutId)
    );
    
    // If not found and workoutId is a number, try array index
    if (!workout && !isNaN(workoutId)) {
      const index = parseInt(workoutId);
      if (index >= 0 && index < day.workouts.length) {
        workout = day.workouts[index];
      }
    }
    
    if (!workout) {
      return NextResponse.json(
        { 
          message: "Workout not found",
          debug: {
            workoutId,
            availableWorkouts: day.workouts.map(w => ({
              id: w.id,
              _id: w._id,
              name: w.name
            }))
          }
        },
        { status: 404 }
      );
    }

    // Start the workout session
    const startTime = new Date();
    
    // Update workout status
    workout.status = 'in_progress';
    workout.startedAt = startTime;
    workout.currentExerciseIndex = 0;

    // Save the updated plan
    await plan.save();

    // Send notification for workout start
    try {
      const userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "Workout Started! 💪",
          `You've started "${workout.name}". Let's crush this workout!`,
          {
            type: "workout_started",
            planId: planId,
            workoutId: workoutId,
            workoutName: workout.name,
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
                  type: "workout_started",
                  description: `Started workout: ${workout.name}`,
                  timestamp: new Date(),
                  details: {
                    workoutName: workout.name,
                    planName: plan.name,
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
      console.error("Failed to send workout start notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Workout session started successfully",
      session: {
        workoutId: workoutId,
        planId: planId,
        weekNumber: weekNumber,
        dayNumber: dayNumber,
        startedAt: startTime,
        status: 'in_progress',
        currentExerciseIndex: 0
      },
      workout: workout
    });
    
  } catch (error) {
    console.error("Error starting workout session:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}