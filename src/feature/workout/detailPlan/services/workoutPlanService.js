// Feature-scoped workout plan service for plan detail (week, day, and exercise management).
// Shared infrastructure and batch exercise helpers are imported from workoutApiBase.
import {
  BASE_URL,
  getAuthHeaders,
  handleResponse,
  getWorkoutPlan,
  batchAddExercisesToWorkout,
  addExerciseWithAI,
  addExistingExerciseById,
  addCustomExerciseToWorkout,
  addSmartExerciseToWorkout,
} from "@/service/workoutApiBase";

export {
  getWorkoutPlan,
  batchAddExercisesToWorkout,
  addExerciseWithAI,
  addExistingExerciseById,
  addCustomExerciseToWorkout,
  addSmartExerciseToWorkout,
};

// ─── Plan update ──────────────────────────────────────────────────────────────

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

// ─── Week & day management ────────────────────────────────────────────────────

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

export const updateWeek = async (planId, weekNumber, weekData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}`,
      { method: "PUT", headers, body: JSON.stringify(weekData) }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating week:", error);
    throw error;
  }
};

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
      { method: "POST", headers, body: JSON.stringify(workoutData) }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding workout to day:", error);
    throw error;
  }
};

// ─── Exercise management ──────────────────────────────────────────────────────

// Simple add to a workout (single exercise payload, no batch logic).
export const addExercisesToWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseData
) => {
  try {
    console.log("🚀 Adding exercises to workout:", {
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      exerciseCount: exerciseData.exercises?.length || 1,
    });
    const url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    console.log("📤 Request URL:", url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(exerciseData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to add exercises");
    }
    console.log("✅ Successfully added exercises:", data);
    return data;
  } catch (error) {
    console.error("❌ Error in addExercisesToWorkout:", error);
    throw error;
  }
};

// Fetch exercises from a workout (simplified URL, no index path).
export const getWorkoutExercisesFromWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch workout exercises: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    throw error;
  }
};

// Update exercises in a workout (simplified URL, no index path).
export const updateWorkoutExercisesFromWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  updateData
) => {
  try {
    const url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to update exercises");
    }
    return data;
  } catch (error) {
    console.error("Error updating workout exercises:", error);
    throw error;
  }
};

export const deleteExerciseFromWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseIndex
) => {
  try {
    const url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseIndex}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { method: "DELETE", headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to delete exercise");
    }
    return data;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    throw error;
  }
};

export const deleteWorkoutFromDay = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { method: "DELETE", headers });
    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting workout from day:", error);
    throw error;
  }
};

export const clearDayWorkouts = async (planId, weekNumber, dayNumber) => {
  try {
    const url = `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { method: "DELETE", headers });
    return handleResponse(response);
  } catch (error) {
    console.error("Error clearing day workouts:", error);
    throw error;
  }
};

// Read-modify-write: updates target sets/reps/weight for a single exercise.
export const updateExerciseTargetsInWorkout = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exerciseIndex,
  targetUpdates
) => {
  try {
    const workoutData = await getWorkoutExercisesFromWorkout(
      planId,
      weekNumber,
      dayNumber,
      workoutId
    );
    const currentExercises = Array.isArray(workoutData?.exercises)
      ? workoutData.exercises
      : [];

    if (exerciseIndex < 0 || exerciseIndex >= currentExercises.length) {
      throw new Error("Exercise not found");
    }

    const updatedExercises = currentExercises.map((exercise, index) => {
      if (index !== exerciseIndex) return exercise;
      return {
        ...exercise,
        targetSets:
          targetUpdates.targetSets !== undefined
            ? Number(targetUpdates.targetSets)
            : exercise.targetSets,
        targetReps:
          targetUpdates.targetReps !== undefined
            ? targetUpdates.targetReps
            : exercise.targetReps,
        targetWeight:
          targetUpdates.targetWeight !== undefined
            ? Number(targetUpdates.targetWeight)
            : exercise.targetWeight,
      };
    });

    return updateWorkoutExercisesFromWorkout(
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      { exercises: updatedExercises }
    );
  } catch (error) {
    console.error("Error updating exercise targets:", error);
    throw error;
  }
};

// Fetch exercises via index-aware URL.
export const getWorkoutExercises = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const headers = await getAuthHeaders();
    const url =
      typeof workoutId === "number" || /^\d+$/.test(workoutId)
        ? `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`
        : `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
    const response = await fetch(url, { method: "GET", headers });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    throw error;
  }
};

// Bulk update or reorder exercises via index-aware URL.
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
    const url =
      typeof workoutId === "number" || /^\d+$/.test(workoutId)
        ? `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises`
        : `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`;
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

// Look up a workout by its array index within a plan's week/day.
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

// ─── Default export ───────────────────────────────────────────────────────────

const workoutPlanService = {
  getWorkoutPlan,
  batchAddExercisesToWorkout,
  addExerciseWithAI,
  addExistingExerciseById,
  addCustomExerciseToWorkout,
  addSmartExerciseToWorkout,
  updateWorkoutPlan,
  addWeekToPlan,
  updateWeek,
  addWorkoutToDay,
  addExercisesToWorkout,
  getWorkoutExercisesFromWorkout,
  updateWorkoutExercisesFromWorkout,
  deleteExerciseFromWorkout,
  deleteWorkoutFromDay,
  clearDayWorkouts,
  updateExerciseTargetsInWorkout,
  getWorkoutExercises,
  updateWorkoutExercises,
  getWorkoutByIndex,
};

export default workoutPlanService;

