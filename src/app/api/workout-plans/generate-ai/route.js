// api/workout-plans/generate-ai/route.js - Generate AI workout plan
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";

// POST /api/workout-plans/generate-ai - Generate AI workout plan
export async function POST(request) {
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

    await connectDB();

    const preferences = await request.json();

    // Validate required preferences
    const {
      goal,
      fitnessLevel,
      workoutFrequency,
      duration,
      equipment,
      targetMuscleGroups
    } = preferences;

    if (!goal || !fitnessLevel || !workoutFrequency || !duration) {
      return NextResponse.json(
        {
          message: "Missing required fields: goal, fitnessLevel, workoutFrequency, duration",
        },
        { status: 400 }
      );
    }

    // Here you would integrate with your AI service (OpenAI, etc.)
    // For now, we'll create a basic structured plan based on preferences
    const aiGeneratedPlan = await generateWorkoutPlan(preferences);

    // Create new workout plan with AI-generated content
    const workoutPlan = new WorkoutPlan({
      userId: user.uid,
      name: aiGeneratedPlan.name,
      description: aiGeneratedPlan.description,
      goal,
      difficulty: fitnessLevel,
      duration,
      workoutFrequency,
      weeks: aiGeneratedPlan.weeks,
      targetMuscleGroups: targetMuscleGroups || [],
      equipment: equipment || [],
      tags: ['ai-generated', goal.toLowerCase()],
      createdBy: 'ai',
      isActive: false
    });

    const savedPlan = await workoutPlan.save();

    // Send notification for AI workout plan generation
    try {
      const userData = await User.findOne({ firebaseUid: user.uid });
      
      if (userData && userData.pushToken) {
        await NotificationService.sendCustomNotification(
          userData.pushToken,
          "AI Workout Plan Generated! 🤖",
          `Your personalized "${aiGeneratedPlan.name}" workout plan is ready!`,
          {
            type: "ai_workout_plan_generated",
            planId: savedPlan._id.toString(),
            planName: aiGeneratedPlan.name,
            goal: goal,
          }
        );
        
        // Add activity to user's recent activities
        await User.findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $push: {
              recentActivities: {
                $each: [{
                  type: "ai_workout_plan_generated",
                  description: `AI generated workout plan: ${aiGeneratedPlan.name}`,
                  timestamp: new Date(),
                  details: {
                    planName: aiGeneratedPlan.name,
                    goal: goal,
                    fitnessLevel: fitnessLevel,
                    duration: duration
                  }
                }],
                $slice: -10,
              },
            },
          }
        );
      }
    } catch (notificationError) {
      console.error("Failed to send AI workout plan generation notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      message: "AI workout plan generated successfully",
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error generating AI workout plan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate workout plan structure
async function generateWorkoutPlan(preferences) {
  const {
    goal,
    fitnessLevel,
    workoutFrequency,
    duration,
    equipment = [],
    targetMuscleGroups = [],
    timePerWorkout = 60
  } = preferences;

  // Basic AI logic for plan generation
  const planName = `${goal} ${fitnessLevel} Plan`;
  const description = `AI-generated ${duration}-week ${goal.toLowerCase()} plan for ${fitnessLevel.toLowerCase()} level, ${workoutFrequency}x per week.`;

  // Generate weeks based on duration
  const weeks = [];
  for (let weekNum = 1; weekNum <= duration; weekNum++) {
    const week = {
      weekNumber: weekNum,
      theme: getWeekTheme(weekNum, goal, fitnessLevel),
      days: generateWeekDays(workoutFrequency, goal, fitnessLevel, equipment, targetMuscleGroups, timePerWorkout, weekNum)
    };
    weeks.push(week);
  }

  return {
    name: planName,
    description: description,
    weeks: weeks
  };
}

// Helper function to get week theme based on progression
function getWeekTheme(weekNum, goal, fitnessLevel) {
  const themes = {
    'Weight Loss': ['Foundation Building', 'Cardio Focus', 'Strength Building', 'High Intensity'],
    'Muscle Gain': ['Form & Foundation', 'Volume Building', 'Strength Focus', 'Peak Training'],
    'Strength': ['Base Building', 'Power Development', 'Max Strength', 'Peak Performance'],
    'Endurance': ['Base Building', 'Aerobic Development', 'Threshold Training', 'Peak Endurance']
  };

  const goalThemes = themes[goal] || themes['Weight Loss'];
  const themeIndex = Math.min(weekNum - 1, goalThemes.length - 1);
  return goalThemes[themeIndex];
}

// Helper function to generate days for a week
function generateWeekDays(frequency, goal, fitnessLevel, equipment, targetMuscleGroups, timePerWorkout, weekNum) {
  const days = Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
    workouts: [],
    isRestDay: true
  }));

  // Distribute workouts across the week
  const workoutDays = getWorkoutDays(frequency);
  
  workoutDays.forEach((dayIndex, workoutIndex) => {
    days[dayIndex].isRestDay = false;
    days[dayIndex].workouts = [generateWorkout(goal, fitnessLevel, equipment, targetMuscleGroups, timePerWorkout, weekNum, workoutIndex)];
  });

  return days;
}

// Helper function to determine which days to work out
function getWorkoutDays(frequency) {
  const schedules = {
    1: [0], // Monday
    2: [0, 3], // Monday, Thursday
    3: [0, 2, 4], // Monday, Wednesday, Friday
    4: [0, 1, 3, 5], // Monday, Tuesday, Thursday, Saturday
    5: [0, 1, 2, 4, 5], // Monday-Wednesday, Friday, Saturday
    6: [0, 1, 2, 3, 4, 5], // Monday-Saturday
    7: [0, 1, 2, 3, 4, 5, 6] // Every day
  };
  
  return schedules[frequency] || schedules[3];
}

// Helper function to generate a single workout
function generateWorkout(goal, fitnessLevel, equipment, targetMuscleGroups, timePerWorkout, weekNum, workoutIndex) {
  const workoutTypes = {
    'Weight Loss': ['HIIT Cardio', 'Circuit Training', 'Strength + Cardio'],
    'Muscle Gain': ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body'],
    'Strength': ['Compound Movements', 'Power Training', 'Max Strength'],
    'Endurance': ['Cardio Base', 'Interval Training', 'Long Duration']
  };

  const goalWorkouts = workoutTypes[goal] || workoutTypes['Weight Loss'];
  const workoutType = goalWorkouts[workoutIndex % goalWorkouts.length];

  return {
    id: `workout_${weekNum}_${workoutIndex}`,
    name: workoutType,
    type: goal.toLowerCase().replace(' ', '_'),
    duration: timePerWorkout,
    intensity: getIntensity(fitnessLevel, weekNum),
    exercises: generateExercises(workoutType, goal, fitnessLevel, equipment, weekNum),
    notes: `Week ${weekNum} - ${workoutType}`,
    warmUp: {
      duration: 10,
      exercises: ['Dynamic stretching', 'Light cardio', 'Joint mobility']
    },
    coolDown: {
      duration: 10,
      exercises: ['Static stretching', 'Deep breathing', 'Foam rolling']
    }
  };
}

// Helper function to get workout intensity
function getIntensity(fitnessLevel, weekNum) {
  const baseIntensity = {
    'Beginner': 60,
    'Intermediate': 70,
    'Advanced': 80
  };
  
  const base = baseIntensity[fitnessLevel] || 60;
  const progression = Math.min(weekNum * 2, 20); // Max 20% increase
  
  return Math.min(base + progression, 95);
}

// Helper function to generate exercises for a workout
function generateExercises(workoutType, goal, fitnessLevel, equipment, weekNum) {
  // Basic exercise database - in a real app, this would be more comprehensive
  const exerciseDatabase = {
    'HIIT Cardio': [
      { name: 'Burpees', sets: 4, reps: '30 sec', rest: '30 sec', muscleGroups: ['Full Body'] },
      { name: 'Jump Squats', sets: 4, reps: '30 sec', rest: '30 sec', muscleGroups: ['Legs'] },
      { name: 'Mountain Climbers', sets: 4, reps: '30 sec', rest: '30 sec', muscleGroups: ['Core', 'Cardio'] },
      { name: 'High Knees', sets: 4, reps: '30 sec', rest: '30 sec', muscleGroups: ['Legs', 'Cardio'] }
    ],
    'Push Day': [
      { name: 'Push-ups', sets: 3, reps: '8-12', rest: '60 sec', muscleGroups: ['Chest', 'Shoulders', 'Triceps'] },
      { name: 'Dumbbell Press', sets: 3, reps: '8-12', rest: '60 sec', muscleGroups: ['Chest'] },
      { name: 'Shoulder Press', sets: 3, reps: '8-12', rest: '60 sec', muscleGroups: ['Shoulders'] },
      { name: 'Tricep Dips', sets: 3, reps: '8-12', rest: '60 sec', muscleGroups: ['Triceps'] }
    ],
    'Pull Day': [
      { name: 'Pull-ups', sets: 3, reps: '5-10', rest: '60 sec', muscleGroups: ['Back', 'Biceps'] },
      { name: 'Dumbbell Rows', sets: 3, reps: '8-12', rest: '60 sec', muscleGroups: ['Back'] },
      { name: 'Bicep Curls', sets: 3, reps: '10-15', rest: '45 sec', muscleGroups: ['Biceps'] },
      { name: 'Face Pulls', sets: 3, reps: '12-15', rest: '45 sec', muscleGroups: ['Rear Delts'] }
    ],
    'Leg Day': [
      { name: 'Squats', sets: 4, reps: '8-12', rest: '90 sec', muscleGroups: ['Legs'] },
      { name: 'Deadlifts', sets: 3, reps: '6-10', rest: '120 sec', muscleGroups: ['Legs', 'Back'] },
      { name: 'Lunges', sets: 3, reps: '10-12 each leg', rest: '60 sec', muscleGroups: ['Legs'] },
      { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '45 sec', muscleGroups: ['Calves'] }
    ]
  };

  const exercises = exerciseDatabase[workoutType] || exerciseDatabase['HIIT Cardio'];
  
  // Adjust sets/reps based on fitness level and week progression
  return exercises.map(exercise => ({
    ...exercise,
    sets: adjustSetsForLevel(exercise.sets, fitnessLevel, weekNum),
    reps: adjustRepsForLevel(exercise.reps, fitnessLevel, weekNum),
    weight: getRecommendedWeight(exercise.name, fitnessLevel),
    instructions: `Perform ${exercise.name} with proper form`,
    videoUrl: null, // Would be populated with actual video URLs
    notes: `Week ${weekNum} progression`
  }));
}

// Helper functions for exercise adjustments
function adjustSetsForLevel(baseSets, fitnessLevel, weekNum) {
  const levelModifier = {
    'Beginner': -1,
    'Intermediate': 0,
    'Advanced': 1
  };
  
  const weekProgression = Math.floor(weekNum / 4); // Add set every 4 weeks
  return Math.max(1, baseSets + (levelModifier[fitnessLevel] || 0) + weekProgression);
}

function adjustRepsForLevel(baseReps, fitnessLevel, weekNum) {
  if (baseReps.includes('sec')) return baseReps; // Time-based exercises
  
  const levelModifier = {
    'Beginner': 0.8,
    'Intermediate': 1.0,
    'Advanced': 1.2
  };
  
  // Simple rep adjustment - in real app would be more sophisticated
  return baseReps;
}

function getRecommendedWeight(exerciseName, fitnessLevel) {
  // This would be more sophisticated in a real app
  const baseWeights = {
    'Beginner': 'Bodyweight or light weights',
    'Intermediate': 'Moderate weights',
    'Advanced': 'Heavy weights'
  };
  
  return baseWeights[fitnessLevel] || 'Adjust based on your capability';
}