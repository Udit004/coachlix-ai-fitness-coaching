// Shared base utilities and core reads used by all workout feature services.
// Individual feature services (planList, detailPlan, session) import from here.
import { auth } from "@/lib/firebase";

export const BASE_URL = "/api/workout-plans";

// ─── Auth & response helpers ──────────────────────────────────────────────────

export const getAuthHeaders = async () => {
  let user = auth.currentUser;
  if (!user) {
    for (let attempt = 0; attempt < 5 && !user; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      user = auth.currentUser;
    }
  }
  if (!user) throw new Error("User not authenticated");
  const token = await user.getIdToken(true);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

// ─── Core plan reads (used by all three feature services) ────────────────────

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
    const url = `${BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { headers, cache: "no-store" });
    const data = await handleResponse(response);
    return Array.isArray(data?.plans)
      ? data.plans
      : Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    throw error;
  }
};

// ─── Exercise catalog (used by detailPlan & session batch operations) ─────────

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

// ─── Exercise batch add helpers (shared by detailPlan & session) ──────────────

const _exercisesUrl = (planId, weekNumber, dayNumber, workoutId) => {
  const base = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts`;
  return typeof workoutId === "number" || /^\d+$/.test(workoutId)
    ? `${base}/index/${workoutId}/exercises`
    : `${base}/${workoutId}/exercises`;
};

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
    const response = await fetch(
      _exercisesUrl(planId, weekNumber, dayNumber, workoutId),
      {
        method: "POST",
        headers,
        body: JSON.stringify({
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
        }),
      }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding exercise with AI:", error);
    throw error;
  }
};

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
    const response = await fetch(
      _exercisesUrl(planId, weekNumber, dayNumber, workoutId),
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          exerciseId,
          targetSets: options.targetSets || 3,
          targetReps: options.targetReps || "8-12",
          targetWeight: options.targetWeight || 0,
          instructions: options.instructions,
        }),
      }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding existing exercise:", error);
    throw error;
  }
};

export const addCustomExerciseToWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseData
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      _exercisesUrl(planId, weekNumber, dayNumber, workoutId),
      {
        method: "POST",
        headers,
        body: JSON.stringify({
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
        }),
      }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding custom exercise:", error);
    throw error;
  }
};

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
    try {
      const searchResults = await searchExercises(exerciseName);
      if (searchResults.exercises?.length > 0) {
        const found = searchResults.exercises[0];
        console.log("✅ Found exercise in database:", found.name);
        return addExistingExerciseById(
          planId, weekNumber, dayNumber, workoutId, found._id, options
        );
      }
    } catch (searchError) {
      console.warn("Database search failed, using AI:", searchError.message);
    }
    console.log("🤖 Using AI for exercise addition");
    return addExerciseWithAI(
      planId, weekNumber, dayNumber, workoutId, exerciseName, options
    );
  } catch (error) {
    console.error("Error with smart exercise addition:", error);
    throw error;
  }
};

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
          result = await addExistingExerciseById(
            planId, weekNumber, dayNumber, workoutId,
            exerciseData.exerciseId, exerciseData.options || {}
          );
        } else if (exerciseData.exerciseName && exerciseData.useAI) {
          result = await addExerciseWithAI(
            planId, weekNumber, dayNumber, workoutId,
            exerciseData.exerciseName, exerciseData.options || {}
          );
        } else if (exerciseData.exerciseName) {
          result = await addSmartExerciseToWorkout(
            planId, weekNumber, dayNumber, workoutId,
            exerciseData.exerciseName, exerciseData.options || {}
          );
        } else {
          result = await addCustomExerciseToWorkout(
            planId, weekNumber, dayNumber, workoutId, exerciseData
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
