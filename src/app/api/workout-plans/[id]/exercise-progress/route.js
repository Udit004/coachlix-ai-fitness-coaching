// api/workout-plans/[id]/exercise-progress/route.js
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// PUT /api/workout-plans/[id]/exercise-progress - Update exercise progress and sets
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id: planId } = resolvedParams;
    
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization header missing" }, { status: 401 });
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
      sets, 
      isCompleted, 
      notes,
      personalRecord 
    } = body;

    if (!weekNumber || !dayNumber || workoutIndex === undefined || exerciseIndex === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const plan = await WorkoutPlan.findOne({ _id: planId, userId: user.uid });
    if (!plan) {
      return NextResponse.json({ message: "Workout plan not found" }, { status: 404 });
    }

    // Navigate to the specific exercise
    const week = plan.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) {
      return NextResponse.json({ message: "Week not found" }, { status: 404 });
    }

    const day = week.days.find(d => d.dayNumber === dayNumber);
    if (!day) {
      return NextResponse.json({ message: "Day not found" }, { status: 404 });
    }

    const workout = day.workouts[workoutIndex];
    if (!workout) {
      return NextResponse.json({ message: "Workout not found" }, { status: 404 });
    }

    const exercise = workout.exercises[exerciseIndex];
    if (!exercise) {
      return NextResponse.json({ message: "Exercise not found" }, { status: 404 });
    }

    // Update exercise data
    if (sets && Array.isArray(sets)) {
      // Validate and update sets
      exercise.sets = sets.map(set => ({
        reps: set.reps || 0,
        weight: set.weight || 0,
        duration: set.duration || 0,
        distance: set.distance || 0,
        restTime: set.restTime || 60,
        completed: set.completed || false,
        notes: set.notes || ''
      }));
    }

    if (isCompleted !== undefined) {
      exercise.isCompleted = isCompleted;
    }

    if (notes !== undefined) {
      exercise.notes = notes;
    }

    // Update personal record if provided
    if (personalRecord && personalRecord.weight && personalRecord.reps) {
      exercise.personalRecord = {
        weight: personalRecord.weight,
        reps: personalRecord.reps,
        date: new Date()
      };

      // Also update the plan's strongest lifts
      const existingRecordIndex = plan.stats.strongestLifts.findIndex(
        record => record.exercise === exercise.name
      );

      const newRecord = {
        exercise: exercise.name,
        weight: personalRecord.weight,
        reps: personalRecord.reps,
        date: new Date()
      };

      if (existingRecordIndex !== -1) {
        // Update existing record if this is better
        const existing = plan.stats.strongestLifts[existingRecordIndex];
        if (personalRecord.weight > existing.weight || 
            (personalRecord.weight === existing.weight && personalRecord.reps > existing.reps)) {
          plan.stats.strongestLifts[existingRecordIndex] = newRecord;
        }
      } else {
        // Add new record
        plan.stats.strongestLifts.push(newRecord);
      }
    }

    await plan.save();

    return NextResponse.json({
      success: true,
      message: "Exercise progress updated successfully",
      exercise: {
        name: exercise.name,
        sets: exercise.sets,
        isCompleted: exercise.isCompleted,
        personalRecord: exercise.personalRecord
      }
    });

  } catch (error) {
    console.error("Error updating exercise progress:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}