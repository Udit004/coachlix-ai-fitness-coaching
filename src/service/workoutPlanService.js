// services/workoutPlanService.js - Fixed version
import { auth } from "@/lib/firebase";

const BASE_URL = "/api/workout-plans";

// Get authorization header with Firebase token
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  const data = await response.json();
  return data;
};

// Get all workout plans for current user
export const getWorkoutPlans = async (options = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (options.activeOnly) params.append("active", "true");
    if (options.goal) params.append("goal", options.goal);
    if (options.difficulty) params.append("difficulty", options.difficulty);
    if (options.templatesOnly) params.append("templates", "true");
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.sort) params.append("sort", options.sort);

    const url = `${BASE_URL}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await fetch(url, { headers });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    throw error;
  }
};

// Get single workout plan by ID
export const getWorkoutPlan = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}`, { headers });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching workout plan:", error);
    throw error;
  }
};

// Create new workout plan
export const createWorkoutPlan = async (planData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(planData),
    });

    const data = await handleResponse(response);
    return data.plan || data;
  } catch (error) {
    console.error("Error creating workout plan:", error);
    throw error;
  }
};

// Update workout plan
export const updateWorkoutPlan = async (planId, updateData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(BASE_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify({ planId, ...updateData }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating workout plan:", error);
    throw error;
  }
};

// Delete workout plan
export const deleteWorkoutPlan = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}?planId=${planId}`, {
      method: "DELETE",
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    throw error;
  }
};

// Update specific workout plan (using individual ID endpoint)
export const updateSpecificWorkoutPlan = async (planId, updateData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating workout plan:", error);
    throw error;
  }
};

// Delete specific workout plan (using individual ID endpoint)
export const deleteSpecificWorkoutPlan = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}`, {
      method: "DELETE",
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    throw error;
  }
};

// Add week to workout plan
export const addWeekToPlan = async (planId, weekData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/weeks`, {
      method: "POST",
      headers,
      body: JSON.stringify(weekData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding week to workout plan:", error);
    throw error;
  }
};

// Update specific week
export const updateWeek = async (planId, weekNumber, weekData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/weeks/${weekNumber}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(weekData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating week:", error);
    throw error;
  }
};

// Add workout to specific day
export const addWorkoutToDay = async (
  planId,
  weekNumber,
  dayNumber,
  workoutData
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(workoutData),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding workout to day:", error);
    throw error;
  }
};

// ========== EXERCISE MANAGEMENT ==========

  // Add exercises to a workout
  export const addExercisesToWorkout = async (planId, weekNumber, dayNumber, workoutId, exerciseData) => {
    try {
      console.log('🚀 Adding exercises to workout:', {
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseCount: exerciseData.exercises?.length || 1
      });
  
      // Determine URL based on workoutId type
      let url;
      if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
        // Numeric workoutId - treat as array index
        url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
      } else {
        // String workoutId - treat as MongoDB _id
        url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
      }
  
      console.log('📤 Request URL:', url);
      console.log('📤 Request data:', exerciseData);
  
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(exerciseData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('❌ Failed to add exercises:', data);
        throw new Error(data.error || data.message || 'Failed to add exercises');
      }
  
      console.log('✅ Successfully added exercises:', data);
      return data;
  
    } catch (error) {
      console.error('❌ Error in addExercisesToWorkout:', error);
      throw error;
    }
  };
  
  // Get exercises from a workout
  export const getWorkoutExercisesFromWorkout = async (planId, weekNumber, dayNumber, workoutId) => {
    try {
      let url;
      if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
        url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
      } else {
        url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
      }
  
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        headers,
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch workout exercises: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching workout exercises:', error);
      throw error;
    }
  };
  
  // Update workout exercises
  export const updateWorkoutExercisesFromWorkout = async (planId, weekNumber, dayNumber, workoutId, updateData) => {
    try {
      let url;
      if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
        url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
      } else {
        url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
      }
  
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update exercises');
      }
  
      return data;
    } catch (error) {
      console.error('Error updating workout exercises:', error);
      throw error;
    }
  };
  
  // Delete a single exercise from workout
  export const deleteExerciseFromWorkout = async (planId, weekNumber, dayNumber, workoutId, exerciseIndex) => {
    try {
      let baseUrl;
      if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
        baseUrl = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}`;
      } else {
        baseUrl = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}`;
      }
  
      const url = `${baseUrl}/exercises/${exerciseIndex}`;
  
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete exercise');
      }
  
      return data;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  };



  
// Add progress entry
export const addProgressEntry = async (planId, progressData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/progress`, {
      method: "POST",
      headers,
      body: JSON.stringify(progressData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding progress entry:", error);
    throw error;
  }
};

// Get progress history
export const getProgressHistory = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/progress`, {
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching progress history:", error);
    throw error;
  }
};

// Clone workout plan
export const cloneWorkoutPlan = async (planId, newName) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/clone`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newName }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error cloning workout plan:", error);
    throw error;
  }
};

// Get workout statistics
export const getWorkoutStats = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/stats`, {
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching workout stats:", error);
    throw error;
  }
};

// FIXED: Start workout session - now accepts both index and ObjectId
export const startWorkoutSession = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const headers = await getAuthHeaders();

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/start`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/start`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error starting workout session:", error);
    throw error;
  }
};

// FIXED: Complete workout session - now accepts both index and ObjectId
export const completeWorkoutSession = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  sessionData
) => {
  try {
    const headers = await getAuthHeaders();

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/complete`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/complete`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(sessionData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error completing workout session:", error);
    throw error;
  }
};

// FIXED: Log exercise set - now accepts both index and ObjectId
export const logExerciseSet = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseId,
  setData
) => {
  try {
    const headers = await getAuthHeaders();

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises/${exerciseId}/sets`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}/sets`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(setData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error logging exercise set:", error);
    throw error;
  }
};

// Generate AI workout plan
export const generateAIWorkoutPlan = async (preferences) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/generate-ai`, {
      method: "POST",
      headers,
      body: JSON.stringify(preferences),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error generating AI workout plan:", error);
    throw error;
  }
};

// Search exercises database
export const searchExercises = async (query) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `/api/exercises/search?q=${encodeURIComponent(query)}`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error searching exercises:", error);
    throw error;
  }
};

// Get popular exercises
export const getPopularExercises = async (category = null) => {
  try {
    const headers = await getAuthHeaders();
    const url = category
      ? `/api/exercises/popular?category=${category}`
      : "/api/exercises/popular";
    const response = await fetch(url, { headers });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching popular exercises:", error);
    throw error;
  }
};

// Get workout templates
export const getWorkoutTemplates = async () => {
  try {
    return getWorkoutPlans({ templatesOnly: true });
  } catch (error) {
    console.error("Error fetching workout templates:", error);
    throw error;
  }
};

// NEW: Helper function to get workout by index from a plan
export const getWorkoutByIndex = async (
  planId,
  weekNumber,
  dayNumber,
  workoutIndex
) => {
  try {
    const plan = await getWorkoutPlan(planId);
    const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) throw new Error(`Week ${weekNumber} not found`);

    const day = week.days.find((d) => d.dayNumber === dayNumber);
    if (!day) throw new Error(`Day ${dayNumber} not found`);

    const workout = day.workouts[workoutIndex];
    if (!workout) throw new Error(`Workout at index ${workoutIndex} not found`);

    return workout;
  } catch (error) {
    console.error("Error getting workout by index:", error);
    throw error;
  }
};

// Add exercise with AI search integration
export const addExerciseWithAI = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseName,
  options = {}
) => {
  try {
    const headers = await getAuthHeaders();

    const exerciseData = {
      exerciseName: exerciseName.trim(),
      useAI: true,
      targetSets: options.targetSets || 3,
      targetReps: options.targetReps || "8-12",
      targetWeight: options.targetWeight || 0,
      instructions: options.instructions,
      category: options.category,
      muscleGroups: options.muscleGroups,
      equipment: options.equipment,
      difficulty: options.difficulty,
    };

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(exerciseData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding exercise with AI:", error);
    throw error;
  }
};

// Add existing exercise by ID
export const addExistingExerciseById = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseId,
  options = {}
) => {
  try {
    const headers = await getAuthHeaders();

    const exerciseData = {
      exerciseId,
      targetSets: options.targetSets || 3,
      targetReps: options.targetReps || "8-12",
      targetWeight: options.targetWeight || 0,
      instructions: options.instructions,
    };

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(exerciseData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding existing exercise:", error);
    throw error;
  }
};

// Add custom exercise
export const addCustomExerciseToWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseData
) => {
  try {
    const headers = await getAuthHeaders();

    const customExerciseData = {
      exerciseName: exerciseData.name || exerciseData.exerciseName,
      customExercise: true,
      category: exerciseData.category || "Strength",
      muscleGroups: exerciseData.muscleGroups || [],
      equipment: exerciseData.equipment || ["Bodyweight"],
      difficulty: exerciseData.difficulty || "Beginner",
      targetSets: exerciseData.targetSets || 3,
      targetReps: exerciseData.targetReps || "8-12",
      targetWeight: exerciseData.targetWeight || 0,
      instructions: exerciseData.instructions || "",
    };

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(customExerciseData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding custom exercise:", error);
    throw error;
  }
};

// Smart exercise addition - tries database first, then AI if not found
export const addSmartExerciseToWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseName,
  options = {}
) => {
  try {
    console.log("🎯 Smart exercise addition for:", exerciseName);

    // First try to search exercises in database using exercise service
    try {
      const searchResults = await searchExercises(exerciseName);

      if (searchResults.exercises && searchResults.exercises.length > 0) {
        // Found in database, use the first match
        const foundExercise = searchResults.exercises[0];
        console.log("✅ Found exercise in database:", foundExercise.name);

        return addExistingExerciseById(
          planId,
          weekNumber,
          dayNumber,
          workoutId,
          foundExercise._id,
          options
        );
      }
    } catch (searchError) {
      console.warn(
        "Database search failed, proceeding with AI:",
        searchError.message
      );
    }

    // Not found in database or search failed, use AI
    console.log("🤖 Exercise not found in database, using AI");

    return addExerciseWithAI(
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      exerciseName,
      options
    );
  } catch (error) {
    console.error("Error with smart exercise addition:", error);
    throw error;
  }
};

// Get workout exercises
export const getWorkoutExercises = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const headers = await getAuthHeaders();

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    throw error;
  }
};

// Update workout exercises (bulk update or reorder)
export const updateWorkoutExercises = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exercises,
  action = "update"
) => {
  try {
    const headers = await getAuthHeaders();

    let url;
    if (typeof workoutId === "number" || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ exercises, action }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating workout exercises:", error);
    throw error;
  }
};

// Batch add exercises to workout
export const batchAddExercisesToWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exercisesData
) => {
  try {
    const results = [];

    for (const exerciseData of exercisesData) {
      try {
        let result;

        if (exerciseData.exerciseId) {
          // Existing exercise
          result = await addExistingExerciseById(
            planId,
            weekNumber,
            dayNumber,
            workoutId,
            exerciseData.exerciseId,
            exerciseData.options || {}
          );
        } else if (exerciseData.exerciseName && exerciseData.useAI) {
          // AI exercise
          result = await addExerciseWithAI(
            planId,
            weekNumber,
            dayNumber,
            workoutId,
            exerciseData.exerciseName,
            exerciseData.options || {}
          );
        } else if (exerciseData.exerciseName) {
          // Smart addition
          result = await addSmartExerciseToWorkout(
            planId,
            weekNumber,
            dayNumber,
            workoutId,
            exerciseData.exerciseName,
            exerciseData.options || {}
          );
        } else {
          // Custom exercise
          result = await addCustomExerciseToWorkout(
            planId,
            weekNumber,
            dayNumber,
            workoutId,
            exerciseData
          );
        }

        results.push({ success: true, exercise: result.exercise });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          exerciseName: exerciseData.exerciseName || exerciseData.name,
        });
      }
    }

    return { results };
  } catch (error) {
    console.error("Error batch adding exercises:", error);
    throw error;
  }
};

// Default export with all functions for convenience
const workoutPlanService = {
  getWorkoutPlans,
  getWorkoutPlan,
  createWorkoutPlan,
  updateWorkoutPlan,
  updateSpecificWorkoutPlan,
  deleteWorkoutPlan,
  deleteSpecificWorkoutPlan,
  addWeekToPlan,
  updateWeek,
  addWorkoutToDay,
  addExerciseToWorkout,
  updateExercise,
  deleteExercise,
  addProgressEntry,
  getProgressHistory,
  cloneWorkoutPlan,
  getWorkoutStats,
  startWorkoutSession,
  completeWorkoutSession,
  logExerciseSet,
  generateAIWorkoutPlan,
  searchExercises,
  getPopularExercises,
  getWorkoutTemplates,
  getWorkoutByIndex,
  addExerciseWithAI,
  addExistingExerciseById,
  addCustomExerciseToWorkout,
};

export default workoutPlanService;
