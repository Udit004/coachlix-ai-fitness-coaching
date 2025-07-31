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
export const addWorkoutToDay = async (planId, weekNumber, dayNumber, workoutData) => {
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

// FIXED: Add exercise to workout - now accepts both index and ObjectId
export const addExerciseToWorkout = async (planId, weekNumber, dayNumber, workoutId, exerciseData) => {
  try {
    const headers = await getAuthHeaders();
    
    // Handle both array index and ObjectId cases
    let url;
    if (typeof workoutId === 'number' || /^\d+$/.test(workoutId)) {
      // If workoutId is a number or numeric string, use index-based endpoint
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`;
    } else {
      // If workoutId is an ObjectId, use the existing endpoint
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(exerciseData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding exercise to workout:", error);
    throw error;
  }
};

// FIXED: Update exercise - now accepts both index and ObjectId
export const updateExercise = async (planId, weekNumber, dayNumber, workoutId, exerciseId, exerciseData) => {
  try {
    const headers = await getAuthHeaders();
    
    // Handle both array index and ObjectId cases for workoutId
    let url;
    if (typeof workoutId === 'number' || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises/${exerciseId}`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}`;
    }
    
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(exerciseData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating exercise:", error);
    throw error;
  }
};

// FIXED: Delete exercise - now accepts both index and ObjectId
export const deleteExercise = async (planId, weekNumber, dayNumber, workoutId, exerciseId) => {
  try {
    const headers = await getAuthHeaders();
    
    // Handle both array index and ObjectId cases for workoutId
    let url;
    if (typeof workoutId === 'number' || /^\d+$/.test(workoutId)) {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises/${exerciseId}`;
    } else {
      url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}`;
    }
    
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting exercise:", error);
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
export const startWorkoutSession = async (planId, weekNumber, dayNumber, workoutId) => {
  try {
    const headers = await getAuthHeaders();
    
    let url;
    if (typeof workoutId === 'number' || /^\d+$/.test(workoutId)) {
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
export const completeWorkoutSession = async (planId, weekNumber, dayNumber, workoutId, sessionData) => {
  try {
    const headers = await getAuthHeaders();
    
    let url;
    if (typeof workoutId === 'number' || /^\d+$/.test(workoutId)) {
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
export const logExerciseSet = async (planId, weekNumber, dayNumber, workoutId, exerciseId, setData) => {
  try {
    const headers = await getAuthHeaders();
    
    let url;
    if (typeof workoutId === 'number' || /^\d+$/.test(workoutId)) {
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
export const getWorkoutByIndex = async (planId, weekNumber, dayNumber, workoutIndex) => {
  try {
    const plan = await getWorkoutPlan(planId);
    const week = plan.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) throw new Error(`Week ${weekNumber} not found`);
    
    const day = week.days.find(d => d.dayNumber === dayNumber);
    if (!day) throw new Error(`Day ${dayNumber} not found`);
    
    const workout = day.workouts[workoutIndex];
    if (!workout) throw new Error(`Workout at index ${workoutIndex} not found`);
    
    return workout;
  } catch (error) {
    console.error("Error getting workout by index:", error);
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
};

export default workoutPlanService;