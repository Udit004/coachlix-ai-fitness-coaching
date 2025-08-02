// app/api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/exercises/route.js
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import WorkoutPlan from '@/models/WorkoutPlan';
import Exercise from '@/models/Exercise';
import { verifyUserToken } from "@/lib/verifyUser";

export async function POST(request, { params }) {
  try {
    // Connect to database
    await connectDB();

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

    // Extract route parameters - FIXED: await params
    const resolvedParams = await params;
    const { id: planId, weekNumber, dayNumber, workoutId } = resolvedParams;
    
    // Validate parameters
    if (!planId || !weekNumber || !dayNumber || !workoutId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      exerciseId, 
      exerciseName,
      targetSets = 3,
      targetReps = "8-12",
      targetWeight,
      instructions,
      customExercise = false,
      useAI = false // New flag to use AI search
    } = body;

    // Validate required fields
    if (!exerciseId && !exerciseName) {
      return NextResponse.json(
        { error: 'Either exerciseId or exerciseName is required' },
        { status: 400 }
      );
    }

    // Find the workout plan - FIXED: use user.userId
    const workoutPlan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.userId
    });

    if (!workoutPlan) {
      return NextResponse.json(
        { error: 'Workout plan not found or access denied' },
        { status: 404 }
      );
    }

    // Find the specific week
    const week = workoutPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    // Find the specific day
    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    // Find the specific workout - FIXED: Handle both ObjectId and array index
    let workout;
    if (/^[0-9a-fA-F]{24}$/.test(workoutId)) {
      // ObjectId format
      workout = day.workouts.find(w => w._id.toString() === workoutId);
    } else {
      // Array index format
      const workoutIndex = parseInt(workoutId);
      workout = day.workouts[workoutIndex];
    }

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    let exerciseData;

    if (useAI && exerciseName) {
      // Handle AI-powered exercise search and creation
      try {
        console.log('🤖 Using AI to search for exercise:', exerciseName);
        
        // Call your AI search endpoint internally
        const aiResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/exercises/ai-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader // Use the original auth header
          },
          body: JSON.stringify({ exerciseName })
        });

        if (!aiResponse.ok) {
          throw new Error('AI search failed');
        }

        const aiResult = await aiResponse.json();
        const aiExercise = aiResult.exercise;

        exerciseData = {
          name: aiExercise.name,
          category: aiExercise.category,
          muscleGroups: aiExercise.primaryMuscleGroups,
          equipment: aiExercise.equipment,
          instructions: instructions || (Array.isArray(aiExercise.instructions) ? 
            aiExercise.instructions.join('. ') : aiExercise.description),
          difficulty: aiExercise.difficulty,
          sets: [],
          targetSets: targetSets || aiExercise.metrics?.defaultSets || 3,
          targetReps: targetReps || aiExercise.metrics?.defaultReps || "8-12",
          targetWeight: targetWeight || 0,
          isCompleted: false,
          // Add AI metadata for workout tracking
          aiGenerated: true,
          formTips: aiExercise.formTips || [],
          variations: aiExercise.variations || [],
          benefits: aiExercise.benefits || []
        };

        console.log('✅ AI exercise data created successfully');
      } catch (aiError) {
        console.warn('AI search failed, falling back to custom exercise:', aiError.message);
        
        // Fallback to custom exercise if AI fails
        exerciseData = {
          name: exerciseName,
          category: body.category || 'Strength',
          muscleGroups: body.muscleGroups || [],
          equipment: body.equipment || ['Bodyweight'],
          instructions: instructions || '',
          difficulty: body.difficulty || 'Beginner',
          sets: [],
          targetSets,
          targetReps,
          targetWeight: targetWeight || 0,
          isCompleted: false
        };
      }
    } else if (customExercise) {
      // Handle custom exercise creation
      if (!exerciseName) {
        return NextResponse.json(
          { error: 'Exercise name is required for custom exercises' },
          { status: 400 }
        );
      }

      exerciseData = {
        name: exerciseName,
        category: body.category || 'Strength',
        muscleGroups: body.muscleGroups || [],
        equipment: body.equipment || ['Bodyweight'],
        instructions: instructions || '',
        difficulty: body.difficulty || 'Beginner',
        sets: [],
        targetSets,
        targetReps,
        targetWeight: targetWeight || 0,
        isCompleted: false
      };
    } else if (exerciseId) {
      // Handle existing exercise from database
      const existingExercise = await Exercise.findById(exerciseId);
      if (!existingExercise) {
        return NextResponse.json(
          { error: 'Exercise not found' },
          { status: 404 }
        );
      }

      // Create exercise data based on existing exercise
      exerciseData = {
        name: existingExercise.name,
        category: existingExercise.category,
        muscleGroups: existingExercise.primaryMuscleGroups,
        equipment: existingExercise.equipment,
        instructions: instructions || existingExercise.description,
        difficulty: existingExercise.difficulty,
        videoUrl: existingExercise.videoUrl,
        sets: [],
        targetSets: targetSets || existingExercise.metrics?.defaultSets || 3,
        targetReps: targetReps || existingExercise.metrics?.defaultReps || "8-12",
        targetWeight: targetWeight || 0,
        isCompleted: false
      };

      // Log exercise usage for analytics
      try {
        await existingExercise.incrementPopularity();
      } catch (error) {
        console.warn('Failed to increment exercise popularity:', error.message);
      }
    } else if (exerciseName) {
      // Try to find exercise by name in database first
      const existingExercise = await Exercise.findOne({ 
        name: { $regex: new RegExp(exerciseName, 'i') },
        isActive: true 
      });

      if (existingExercise) {
        // Use found exercise
        exerciseData = {
          name: existingExercise.name,
          category: existingExercise.category,
          muscleGroups: existingExercise.primaryMuscleGroups,
          equipment: existingExercise.equipment,
          instructions: instructions || existingExercise.description,
          difficulty: existingExercise.difficulty,
          videoUrl: existingExercise.videoUrl,
          sets: [],
          targetSets: targetSets || existingExercise.metrics?.defaultSets || 3,
          targetReps: targetReps || existingExercise.metrics?.defaultReps || "8-12",
          targetWeight: targetWeight || 0,
          isCompleted: false
        };

        // Log exercise usage
        try {
          await existingExercise.incrementPopularity();
        } catch (error) {
          console.warn('Failed to increment exercise popularity:', error.message);
        }
      } else {
        // Exercise not found in database, create custom
        exerciseData = {
          name: exerciseName,
          category: body.category || 'Strength',
          muscleGroups: body.muscleGroups || [],
          equipment: body.equipment || ['Bodyweight'],
          instructions: instructions || '',
          difficulty: body.difficulty || 'Beginner',
          sets: [],
          targetSets,
          targetReps,
          targetWeight: targetWeight || 0,
          isCompleted: false,
          customCreated: true
        };
      }
    }

    // Initialize sets based on target sets
    for (let i = 0; i < exerciseData.targetSets; i++) {
      exerciseData.sets.push({
        reps: parseInt(exerciseData.targetReps.split('-')[0]) || 8,
        weight: exerciseData.targetWeight || 0,
        duration: 0,
        distance: 0,
        restTime: 60,
        completed: false,
        notes: ''
      });
    }

    // Add exercise to workout
    workout.exercises.push(exerciseData);

    // Update workout estimated duration (rough calculation)
    const exerciseTime = exerciseData.targetSets * 2; // 2 minutes per set average
    workout.estimatedDuration = (workout.estimatedDuration || 0) + exerciseTime;

    // Save the workout plan
    await workoutPlan.save();

    // Return the added exercise with its generated ID
    const addedExercise = workout.exercises[workout.exercises.length - 1];

    return NextResponse.json({
      success: true,
      message: 'Exercise added successfully',
      exercise: addedExercise,
      workout: {
        id: workout._id,
        name: workout.name,
        estimatedDuration: workout.estimatedDuration,
        exerciseCount: workout.exercises.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding exercise to workout:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
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

    // Connect to database
    await connectDB();

    // Extract route parameters - FIXED: await params
    const resolvedParams = await params;
    const { id: planId, weekNumber, dayNumber, workoutId } = resolvedParams;

    // Find the workout plan and get exercises - FIXED: use user.userId
    const workoutPlan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.userId
    });

    if (!workoutPlan) {
      return NextResponse.json(
        { error: 'Workout plan not found or access denied' },
        { status: 404 }
      );
    }

    // Navigate to the specific workout
    const week = workoutPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    // Find the specific workout - FIXED: Handle both ObjectId and array index
    let workout;
    if (/^[0-9a-fA-F]{24}$/.test(workoutId)) {
      // ObjectId format
      workout = day.workouts.find(w => w._id.toString() === workoutId);
    } else {
      // Array index format
      const workoutIndex = parseInt(workoutId);
      workout = day.workouts[workoutIndex];
    }

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exercises: workout.exercises,
      workout: {
        id: workout._id,
        name: workout.name,
        type: workout.type,
        estimatedDuration: workout.estimatedDuration,
        intensity: workout.intensity,
        exerciseCount: workout.exercises.length
      }
    });

  } catch (error) {
    console.error('Error fetching workout exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
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

    // Connect to database
    await connectDB();

    // Extract route parameters - FIXED: await params
    const resolvedParams = await params;
    const { planId, weekNumber, dayNumber, workoutId } = resolvedParams;
    
    // Parse request body - for bulk exercise updates
    const body = await request.json();
    const { exercises, action } = body;

    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Exercises array is required' },
        { status: 400 }
      );
    }

    // Find the workout plan - FIXED: use user.userId
    const workoutPlan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.userId
    });

    if (!workoutPlan) {
      return NextResponse.json(
        { error: 'Workout plan not found or access denied' },
        { status: 404 }
      );
    }

    // Navigate to workout
    const week = workoutPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    const day = week?.days.find(d => d.dayNumber === parseInt(dayNumber));
    
    // Find the specific workout - FIXED: Handle both ObjectId and array index
    let workout;
    if (day) {
      if (/^[0-9a-fA-F]{24}$/.test(workoutId)) {
        // ObjectId format
        workout = day.workouts.find(w => w._id.toString() === workoutId);
      } else {
        // Array index format
        const workoutIndex = parseInt(workoutId);
        workout = day.workouts[workoutIndex];
      }
    }

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (action === 'reorder') {
      // Reorder exercises
      workout.exercises = exercises;
    } else {
      // Update exercises
      exercises.forEach(exerciseUpdate => {
        const exerciseIndex = workout.exercises.findIndex(
          ex => ex._id.toString() === exerciseUpdate._id
        );
        
        if (exerciseIndex !== -1) {
          Object.assign(workout.exercises[exerciseIndex], exerciseUpdate);
        }
      });
    }

    await workoutPlan.save();

    return NextResponse.json({
      success: true,
      message: 'Exercises updated successfully',
      exercises: workout.exercises
    });

  } catch (error) {
    console.error('Error updating workout exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}