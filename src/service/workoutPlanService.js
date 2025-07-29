// services/workoutPlanService.js
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
  return data; // Return the full response data
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

    // Based on your API, return the plan object
    return data.plan || data; // Handle both response formats
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

// Add exercise to workout
export const addExerciseToWorkout = async (planId, weekNumber, dayNumber, workoutId, exerciseData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(exerciseData),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding exercise to workout:", error);
    throw error;
  }
};

// Update exercise
export const updateExercise = async (planId, weekNumber, dayNumber, workoutId, exerciseId, exerciseData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(exerciseData),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating exercise:", error);
    throw error;
  }
};

// Delete exercise
export const deleteExercise = async (planId, weekNumber, dayNumber, workoutId, exerciseId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}`,
      {
        method: "DELETE",
        headers,
      }
    );

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

// Start workout session
export const startWorkoutSession = async (planId, weekNumber, dayNumber, workoutId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/start`,
      {
        method: "POST",
        headers,
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error starting workout session:", error);
    throw error;
  }
};

// Complete workout session
export const completeWorkoutSession = async (planId, weekNumber, dayNumber, workoutId, sessionData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/complete`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(sessionData),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error completing workout session:", error);
    throw error;
  }
};

// Log exercise set
export const logExerciseSet = async (planId, weekNumber, dayNumber, workoutId, exerciseId, setData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}/sets`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(setData),
      }
    );

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
};

export default workoutPlanService;