// app/api/workout-plans/[planId]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/exercises/route.js

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkoutPlan from '@/models/WorkoutPlan';
import Exercise from '@/models/Exercise';
import { verifyAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    console.log('🚀 POST /api/workout-plans/.../exercises - Adding exercises');
    
    // Connect to database
    await connectDB();
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract parameters
    const { planId, weekNumber, dayNumber, workoutId } = params;
    const requestData = await request.json();
    
    console.log('📝 Request params:', { planId, weekNumber, dayNumber, workoutId });
    console.log('📝 Request data:', requestData);

    // Validate required parameters
    if (!planId || !weekNumber || !dayNumber || workoutId === undefined) {
      return NextResponse.json({ 
        error: 'Missing required parameters',
        received: { planId, weekNumber, dayNumber, workoutId }
      }, { status: 400 });
    }

    // Find the workout plan
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan) {
      return NextResponse.json({ error: 'Workout plan not found' }, { status: 404 });
    }

    // Verify ownership
    if (workoutPlan.userId !== user.uid) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the specific week
    const week = workoutPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return NextResponse.json({ error: `Week ${weekNumber} not found` }, { status: 404 });
    }

    // Find the specific day
    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return NextResponse.json({ error: `Day ${dayNumber} not found` }, { status: 404 });
    }

    // Find the specific workout
    let workout;
    const numericWorkoutId = parseInt(workoutId);
    
    if (!isNaN(numericWorkoutId)) {
      // If workoutId is numeric, treat it as an array index
      workout = day.workouts[numericWorkoutId];
      if (!workout) {
        return NextResponse.json({ 
          error: `Workout at index ${workoutId} not found. Available workouts: ${day.workouts.length}` 
        }, { status: 404 });
      }
    } else {
      // If workoutId is a string, find by _id
      workout = day.workouts.find(w => w._id?.toString() === workoutId);
      if (!workout) {
        return NextResponse.json({ error: `Workout with ID ${workoutId} not found` }, { status: 404 });
      }
    }

    // Process exercises data
    let exercisesToAdd = [];

    if (requestData.exercises && Array.isArray(requestData.exercises)) {
      // Handle multiple exercises (from AddExerciseModal)
      exercisesToAdd = requestData.exercises;
    } else if (requestData.exerciseName || requestData.name) {
      // Handle single exercise
      exercisesToAdd = [requestData];
    } else {
      return NextResponse.json({ 
        error: 'Invalid exercise data format',
        expected: 'Either { exercises: [...] } or single exercise object'
      }, { status: 400 });
    }

    console.log(`📋 Processing ${exercisesToAdd.length} exercises`);

    // Add each exercise to the workout
    for (const exerciseData of exercisesToAdd) {
      console.log(`➕ Adding exercise: ${exerciseData.exerciseName || exerciseData.name}`);

      // Create exercise object based on the WorkoutPlan ExerciseSchema
      const newExercise = {
        name: exerciseData.exerciseName || exerciseData.name,
        category: exerciseData.category || 'Strength',
        muscleGroups: exerciseData.primaryMuscleGroups || exerciseData.muscleGroups || [],
        equipment: exerciseData.equipment || ['Bodyweight'],
        sets: [], // Empty sets array, will be populated during workout
        targetSets: exerciseData.targetSets || 3,
        targetReps: exerciseData.targetReps || "8-12",
        targetWeight: exerciseData.targetWeight || 0,
        instructions: exerciseData.instructions || exerciseData.description || '',
        videoUrl: exerciseData.videoUrl || '',
        difficulty: exerciseData.difficulty || 'Beginner',
        isCompleted: false,
        personalRecord: {
          weight: 0,
          reps: 0,
          date: null
        }
      };

      // Add the exercise to the workout
      workout.exercises.push(newExercise);
    }

    // Save the updated workout plan
    await workoutPlan.save();

    console.log('✅ Successfully added exercises to workout');

    return NextResponse.json({
      success: true,
      message: `Successfully added ${exercisesToAdd.length} exercise(s) to workout`,
      workout: {
        _id: workout._id,
        name: workout.name,
        exerciseCount: workout.exercises.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error adding exercises:', error);
    return NextResponse.json({
      error: 'Failed to add exercises',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { planId, weekNumber, dayNumber, workoutId } = params;

    // Find the workout plan and navigate to the specific workout
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan || workoutPlan.userId !== user.uid) {
      return NextResponse.json({ error: 'Workout plan not found' }, { status: 404 });
    }

    const week = workoutPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    const day = week?.days.find(d => d.dayNumber === parseInt(dayNumber));
    
    let workout;
    const numericWorkoutId = parseInt(workoutId);
    
    if (!isNaN(numericWorkoutId)) {
      workout = day?.workouts[numericWorkoutId];
    } else {
      workout = day?.workouts.find(w => w._id?.toString() === workoutId);
    }

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({
      exercises: workout.exercises,
      workout: {
        _id: workout._id,
        name: workout.name,
        type: workout.type
      }
    });

  } catch (error) {
    console.error('Error fetching workout exercises:', error);
    return NextResponse.json({
      error: 'Failed to fetch exercises',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    // Connect to database
    await connectDB();
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { planId, weekNumber, dayNumber, workoutId } = params;
    const updateData = await request.json();

    // Find and update the workout
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan || workoutPlan.userId !== user.uid) {
      return NextResponse.json({ error: 'Workout plan not found' }, { status: 404 });
    }

    const week = workoutPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    const day = week?.days.find(d => d.dayNumber === parseInt(dayNumber));
    
    let workout;
    const numericWorkoutId = parseInt(workoutId);
    
    if (!isNaN(numericWorkoutId)) {
      workout = day?.workouts[numericWorkoutId];
    } else {
      workout = day?.workouts.find(w => w._id?.toString() === workoutId);
    }

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Update exercises
    if (updateData.exercises) {
      workout.exercises = updateData.exercises;
    }

    await workoutPlan.save();

    return NextResponse.json({
      success: true,
      message: 'Exercises updated successfully',
      exercises: workout.exercises
    });

  } catch (error) {
    console.error('Error updating workout exercises:', error);
    return NextResponse.json({
      error: 'Failed to update exercises',
      details: error.message
    }, { status: 500 });
  }
}