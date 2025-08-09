// app/api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/exercises/route.js

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import Exercise from "@/models/Exercise";
import { verifyUserToken } from "@/lib/verifyUser";

export async function POST(request, { params }) {
  try {
    console.log("🚀 POST /api/workout-plans/.../exercises - Adding exercises");

    // Connect to database
    await connectDB();

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

    // Extract parameters - AWAIT params first and use 'id' as planId
    const { id: planId, weekNumber, dayNumber, workoutId } = await params;
    const requestData = await request.json();

    console.log("📝 Request params:", {
      planId,
      weekNumber,
      dayNumber,
      workoutId,
    });
    console.log("📝 Request data:", requestData);

    // Validate required parameters
    if (!planId || !weekNumber || !dayNumber || workoutId === undefined) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          received: { planId, weekNumber, dayNumber, workoutId },
        },
        { status: 400 }
      );
    }

    // Find the workout plan
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan) {
      return NextResponse.json(
        { error: "Workout plan not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (workoutPlan.userId !== user.uid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the specific week
    const week = workoutPlan.weeks.find(
      (w) => w.weekNumber === parseInt(weekNumber)
    );
    if (!week) {
      return NextResponse.json(
        { error: `Week ${weekNumber} not found` },
        { status: 404 }
      );
    }

    // Find the specific day
    const day = week.days.find((d) => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return NextResponse.json(
        { error: `Day ${dayNumber} not found` },
        { status: 404 }
      );
    }

    // Find the specific workout
    let workout;
    const numericWorkoutId = parseInt(workoutId);

    if (!isNaN(numericWorkoutId)) {
      // If workoutId is numeric, treat it as an array index
      workout = day.workouts[numericWorkoutId];
      if (!workout) {
        return NextResponse.json(
          {
            error: `Workout at index ${workoutId} not found. Available workouts: ${day.workouts.length}`,
          },
          { status: 404 }
        );
      }
    } else {
      // If workoutId is a string, find by _id
      workout = day.workouts.find((w) => w._id?.toString() === workoutId);
      if (!workout) {
        return NextResponse.json(
          { error: `Workout with ID ${workoutId} not found` },
          { status: 404 }
        );
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
      return NextResponse.json(
        {
          error: "Invalid exercise data format",
          expected: "Either { exercises: [...] } or single exercise object",
        },
        { status: 400 }
      );
    }

    console.log(`📋 Processing ${exercisesToAdd.length} exercises`);

    // Mapping functions to convert detailed names to enum values
    const mapMuscleGroups = (muscleGroups) => {
      const muscleGroupMap = {
        'Latissimus Dorsi': 'Back',
        'Trapezius': 'Back',
        'Rhomboids': 'Back',
        'Erector Spinae': 'Back',
        'Teres Major': 'Back',
        'Teres Minor': 'Back',
        'Infraspinatus': 'Back',
        'Supraspinatus': 'Back',
        'Biceps Brachii': 'Arms',
        'Brachialis': 'Arms',
        'Brachioradialis': 'Arms',
        'Triceps Brachii': 'Arms',
        'Deltoids': 'Shoulders',
        'Anterior Deltoid': 'Shoulders',
        'Posterior Deltoid': 'Shoulders',
        'Medial Deltoid': 'Shoulders',
        'Pectoralis Major': 'Chest',
        'Pectoralis Minor': 'Chest',
        'Serratus Anterior': 'Chest',
        'Quadriceps': 'Legs',
        'Hamstrings': 'Legs',
        'Gastrocnemius': 'Calves',
        'Soleus': 'Calves',
        'Gluteus Maximus': 'Glutes',
        'Gluteus Medius': 'Glutes',
        'Gluteus Minimus': 'Glutes',
        'Rectus Abdominis': 'Core',
        'Obliques': 'Core',
        'Transverse Abdominis': 'Core',
        'Erector Spinae': 'Core',
        'Forearms': 'Forearms',
        'Wrist Flexors': 'Forearms',
        'Wrist Extensors': 'Forearms',
      };

      return muscleGroups.map(muscle => muscleGroupMap[muscle] || 'Full Body').filter((value, index, self) => self.indexOf(value) === index);
    };

    const mapEquipment = (equipment) => {
      // Valid equipment enum values from WorkoutPlan schema:
      // ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Resistance Band', 'Kettlebell', 'Medicine Ball', 'TRX', 'Cardio Equipment']
      const equipmentMap = {
        'Pull-up bar': 'Bodyweight', // Map pull-up bar to bodyweight since it's not in enum
        'Pull-up Bar': 'Bodyweight',
        'Barbell': 'Barbell',
        'Dumbbell': 'Dumbbell',
        'Dumbbells': 'Dumbbell',
        'Machine': 'Machine',
        'Cable': 'Cable',
        'Cable Machine': 'Cable',
        'Bodyweight': 'Bodyweight',
        'Body Weight': 'Bodyweight',
        'Resistance Band': 'Resistance Band',
        'Resistance Bands': 'Resistance Band',
        'Kettlebell': 'Kettlebell',
        'Kettlebells': 'Kettlebell',
        'Medicine Ball': 'Medicine Ball',
        'TRX': 'TRX',
        'Suspension Trainer': 'TRX',
        'Cardio Equipment': 'Cardio Equipment',
        'Treadmill': 'Cardio Equipment',
        'Elliptical': 'Cardio Equipment',
        'Stationary Bike': 'Cardio Equipment',
        'Bench': 'Bodyweight', // Map bench to bodyweight since it's not in enum
        'Weight Bench': 'Bodyweight',
      };

      return equipment.map(equip => equipmentMap[equip] || 'Bodyweight').filter((value, index, self) => self.indexOf(value) === index);
    };

    // NEW: Mapping function to handle difficulty values
    const mapDifficulty = (difficulty) => {
      // Valid difficulty enum values: ['Beginner', 'Intermediate', 'Advanced']
      const difficultyString = String(difficulty || 'Beginner').toLowerCase().trim();
      
      // Handle compound difficulty values like "Beginner/Intermediate/Advanced"
      if (difficultyString.includes('/') || difficultyString.includes(',')) {
        // For compound values, return the first valid difficulty mentioned
        const parts = difficultyString.split(/[\/,\-\s]+/);
        for (const part of parts) {
          const cleanPart = part.trim();
          if (cleanPart.includes('beginner')) return 'Beginner';
          if (cleanPart.includes('intermediate')) return 'Intermediate';
          if (cleanPart.includes('advanced')) return 'Advanced';
        }
        // If no recognizable difficulty found, default to Intermediate
        return 'Intermediate';
      }
      
      // Handle single difficulty values
      if (difficultyString.includes('beginner') || difficultyString.includes('novice') || difficultyString.includes('starter')) {
        return 'Beginner';
      }
      if (difficultyString.includes('intermediate') || difficultyString.includes('medium') || difficultyString.includes('moderate')) {
        return 'Intermediate';
      }
      if (difficultyString.includes('advanced') || difficultyString.includes('expert') || difficultyString.includes('hard')) {
        return 'Advanced';
      }
      
      // Default fallback
      return 'Beginner';
    };

    // NEW: Mapping function to handle category values
    const mapCategory = (category) => {
      // Valid category enum values: ['Strength', 'Cardio', 'Flexibility', 'Sports', 'Functional']
      const categoryString = String(category || 'Strength').toLowerCase().trim();
      
      if (categoryString.includes('strength') || categoryString.includes('weight') || categoryString.includes('resistance')) {
        return 'Strength';
      }
      if (categoryString.includes('cardio') || categoryString.includes('aerobic') || categoryString.includes('running') || categoryString.includes('cycling')) {
        return 'Cardio';
      }
      if (categoryString.includes('flexibility') || categoryString.includes('stretch') || categoryString.includes('yoga') || categoryString.includes('mobility')) {
        return 'Flexibility';
      }
      if (categoryString.includes('sport') || categoryString.includes('athletic') || categoryString.includes('game')) {
        return 'Sports';
      }
      if (categoryString.includes('functional') || categoryString.includes('movement') || categoryString.includes('compound')) {
        return 'Functional';
      }
      
      // Default fallback
      return 'Strength';
    };

    // Add each exercise to the workout
    for (const exerciseData of exercisesToAdd) {
      console.log(
        `➕ Adding exercise: ${exerciseData.exerciseName || exerciseData.name}`
      );

      // Get muscle groups, equipment, difficulty, and category
      const rawMuscleGroups = exerciseData.primaryMuscleGroups || exerciseData.muscleGroups || [];
      const rawEquipment = exerciseData.equipment || ["Bodyweight"];
      const rawDifficulty = exerciseData.difficulty;
      const rawCategory = exerciseData.category;

      // Map to valid enum values
      const mappedMuscleGroups = mapMuscleGroups(rawMuscleGroups);
      const mappedEquipment = mapEquipment(rawEquipment);
      const mappedDifficulty = mapDifficulty(rawDifficulty);
      const mappedCategory = mapCategory(rawCategory);

      console.log(`🔄 Mapped muscle groups: ${rawMuscleGroups} -> ${mappedMuscleGroups}`);
      console.log(`🔄 Mapped equipment: ${rawEquipment} -> ${mappedEquipment}`);
      console.log(`🔄 Mapped difficulty: ${rawDifficulty} -> ${mappedDifficulty}`);
      console.log(`🔄 Mapped category: ${rawCategory} -> ${mappedCategory}`);

      // Create exercise object based on the WorkoutPlan ExerciseSchema
      const newExercise = {
        name: exerciseData.exerciseName || exerciseData.name,
        category: mappedCategory,
        muscleGroups: mappedMuscleGroups.length > 0 ? mappedMuscleGroups : ['Full Body'],
        equipment: mappedEquipment.length > 0 ? mappedEquipment : ['Bodyweight'],
        sets: [], // Empty sets array, will be populated during workout
        targetSets: exerciseData.targetSets || 3,
        targetReps: exerciseData.targetReps || "8-12",
        targetWeight: exerciseData.targetWeight || 0,
        instructions:
          exerciseData.instructions || exerciseData.description || "",
        videoUrl: exerciseData.videoUrl || "",
        difficulty: mappedDifficulty,
        isCompleted: false,
        personalRecord: {
          weight: 0,
          reps: 0,
          date: null,
        },
      };

      // Add the exercise to the workout
      workout.exercises.push(newExercise);
    }

    // Save the updated workout plan
    await workoutPlan.save();

    console.log("✅ Successfully added exercises to workout");

    return NextResponse.json(
      {
        success: true,
        message: `Successfully added ${exercisesToAdd.length} exercise(s) to workout`,
        workout: {
          _id: workout._id,
          name: workout.name,
          exerciseCount: workout.exercises.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error adding exercises:", error);
    return NextResponse.json(
      {
        error: "Failed to add exercises",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Connect to database
    await connectDB();

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

    // AWAIT params first and use 'id' as planId
    const { id: planId, weekNumber, dayNumber, workoutId } = await params;

    // Find the workout plan and navigate to the specific workout
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan || workoutPlan.userId !== user.uid) {
      return NextResponse.json(
        { error: "Workout plan not found" },
        { status: 404 }
      );
    }

    const week = workoutPlan.weeks.find(
      (w) => w.weekNumber === parseInt(weekNumber)
    );
    const day = week?.days.find((d) => d.dayNumber === parseInt(dayNumber));

    let workout;
    const numericWorkoutId = parseInt(workoutId);

    if (!isNaN(numericWorkoutId)) {
      workout = day?.workouts[numericWorkoutId];
    } else {
      workout = day?.workouts.find((w) => w._id?.toString() === workoutId);
    }

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    return NextResponse.json({
      exercises: workout.exercises,
      workout: {
        _id: workout._id,
        name: workout.name,
        type: workout.type,
      },
    });
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch exercises",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Connect to database
    await connectDB();

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

    // AWAIT params first and use 'id' as planId
    const { id: planId, weekNumber, dayNumber, workoutId } = await params;
    const updateData = await request.json();

    // Find and update the workout
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan || workoutPlan.userId !== user.uid) {
      return NextResponse.json(
        { error: "Workout plan not found" },
        { status: 404 }
      );
    }

    const week = workoutPlan.weeks.find(
      (w) => w.weekNumber === parseInt(weekNumber)
    );
    const day = week?.days.find((d) => d.dayNumber === parseInt(dayNumber));

    let workout;
    const numericWorkoutId = parseInt(workoutId);

    if (!isNaN(numericWorkoutId)) {
      workout = day?.workouts[numericWorkoutId];
    } else {
      workout = day?.workouts.find((w) => w._id?.toString() === workoutId);
    }

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Update exercises
    if (updateData.exercises) {
      workout.exercises = updateData.exercises;
    }

    await workoutPlan.save();

    return NextResponse.json({
      success: true,
      message: "Exercises updated successfully",
      exercises: workout.exercises,
    });
  } catch (error) {
    console.error("Error updating workout exercises:", error);
    return NextResponse.json(
      {
        error: "Failed to update exercises",
        details: error.message,
      },
      { status: 500 }
    );
  }
}