// Feature-scoped service for workout session, progress, and statistics operations.
// Shared infrastructure and exercise helpers are imported from workoutApiBase.
import {
  BASE_URL,
  getAuthHeaders,
  handleResponse,
  getWorkoutPlan,
  batchAddExercisesToWorkout,
} from "@/service/workoutApiBase";

export { getWorkoutPlan, batchAddExercisesToWorkout };

// ─── Session operations ───────────────────────────────────────────────────────

export const startWorkoutSession = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const headers = await getAuthHeaders();
    const url =
      typeof workoutId === "number" || /^\d+$/.test(workoutId)
        ? `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/start`
        : `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/start`;
    const response = await fetch(url, { method: "POST", headers });
    return handleResponse(response);
  } catch (error) {
    console.error("Error starting workout session:", error);
    throw error;
  }
};

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
    const url =
      typeof workoutId === "number" || /^\d+$/.test(workoutId)
        ? `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/index/${workoutId}/exercises/${exerciseId}/sets`
        : `${BASE_URL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}/sets`;
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

export const updateWorkoutStatus = async (
  planId,
  weekNumber,
  dayNumber,
  workoutIndex,
  status
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/workout-status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        weekNumber,
        dayNumber,
        workoutIndex,
        status,
        completedAt: status === "completed" ? new Date().toISOString() : null,
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating workout status:", error);
    throw error;
  }
};

export const updateExerciseProgress = async (
  planId,
  weekNumber,
  dayNumber,
  workoutIndex,
  exerciseIndex,
  exerciseData
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/exercise-progress`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        weekNumber,
        dayNumber,
        workoutIndex,
        exerciseIndex,
        ...exerciseData,
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating exercise progress:", error);
    throw error;
  }
};

// ─── Local session state (localStorage) ──────────────────────────────────────

export const saveWorkoutSessionProgress = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  sessionData
) => {
  console.log("💾 saveWorkoutSessionProgress called - FOR WORKOUT SESSION DATA");
  try {
    const sessionKey = `workout_session_${planId}_${weekNumber}_${dayNumber}_${workoutId}`;
    const sessionProgress = {
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      exerciseData: sessionData.exerciseData || {},
      notes: sessionData.notes || "",
      completedExercises: sessionData.completedExercises || [],
      sessionDuration: sessionData.totalTime || 0,
      timestamp: new Date().toISOString(),
      lastSaved: Date.now(),
    };
    localStorage.setItem(sessionKey, JSON.stringify(sessionProgress));
    console.log("✅ Workout session progress saved to localStorage");
    return { success: true, message: "Workout progress saved locally", data: sessionProgress };
  } catch (error) {
    console.error("❌ Error saving workout session progress:", error);
    throw error;
  }
};

export const saveWorkoutProgressLocally = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  sessionData
) => {
  console.log("💾 saveWorkoutProgressLocally called");
  const sessionKey = `workout_session_${planId}_${weekNumber}_${dayNumber}_${workoutId}`;
  const sessionProgress = {
    planId,
    weekNumber,
    dayNumber,
    workoutId,
    exerciseData: sessionData.exerciseData || {},
    notes: sessionData.notes || "",
    completedExercises: sessionData.completedExercises || [],
    sessionDuration: sessionData.totalTime || 0,
    timestamp: new Date().toISOString(),
    lastSaved: Date.now(),
    completed: sessionData.completed || false,
  };
  localStorage.setItem(sessionKey, JSON.stringify(sessionProgress));
  console.log("✅ Workout session saved to localStorage");
  return { success: true, message: "Workout progress saved locally", data: sessionProgress };
};

export const getWorkoutSessionProgress = (
  planId,
  weekNumber,
  dayNumber,
  workoutId
) => {
  try {
    const sessionKey = `workout_session_${planId}_${weekNumber}_${dayNumber}_${workoutId}`;
    const saved = localStorage.getItem(sessionKey);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Error getting workout session progress:", error);
    return null;
  }
};

export const isWorkoutCompleted = (planId, weekNumber, dayNumber, workoutId) => {
  try {
    const sessionKey = `workout_completed_${planId}_${weekNumber}_${dayNumber}_${workoutId}`;
    const completed = localStorage.getItem(sessionKey);
    return completed ? JSON.parse(completed) : null;
  } catch (error) {
    console.error("Error checking workout completion:", error);
    return null;
  }
};

// Marks a workout as complete in localStorage and optionally logs a progress entry.
export const completeWorkoutSession = async (
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  sessionData
) => {
  console.log("🏁 completeWorkoutSession called - FOR WORKOUT COMPLETION");
  try {
    const sessionKey = `workout_completed_${planId}_${weekNumber}_${dayNumber}_${workoutId}`;
    const completionData = {
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      exerciseData: sessionData.exerciseData || {},
      notes: sessionData.notes || "",
      completedExercises: sessionData.completedExercises || [],
      totalDuration: sessionData.totalTime || 0,
      completedAt: sessionData.completedAt || new Date().toISOString(),
      completed: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(sessionKey, JSON.stringify(completionData));
    console.log("✅ Workout completion saved to localStorage");

    try {
      await addProgressEntry(planId, {
        date: new Date(),
        notes: `Completed workout - Week ${weekNumber}, Day ${dayNumber}. ${sessionData.notes || ""}`.trim(),
      });
      console.log("✅ Progress entry added for workout completion");
    } catch (progressError) {
      console.warn("⚠️ Could not add progress entry:", progressError);
    }

    return { success: true, message: "Workout completed and saved locally", data: completionData };
  } catch (error) {
    console.error("❌ Error completing workout session:", error);
    throw error;
  }
};

// ─── Progress entries ─────────────────────────────────────────────────────────

export const addProgressEntry = async (planId, progressData) => {
  console.log("📊 addProgressEntry called - FOR BODY MEASUREMENTS ONLY");
  if (!progressData || typeof progressData !== "object") {
    throw new Error("Progress data must be a valid object");
  }
  const hasBodyData =
    progressData.weight ||
    progressData.bodyFat ||
    progressData.measurements ||
    progressData.photos;
  if (!hasBodyData) {
    throw new Error(
      "Progress data must contain body measurements (weight, bodyFat, measurements, or photos)"
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/workout-plans/${planId}/progress`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(progressData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add progress entry");
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding progress entry:", error);
    throw error;
  }
};

export const updateProgressEntry = async (planId, progressId, updateData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");
    const response = await fetch(
      `/api/workout-plans/${planId}/progress/${progressId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update progress entry");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating progress entry:", error);
    throw error;
  }
};

export const deleteProgressEntry = async (planId, progressId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");
    const response = await fetch(
      `/api/workout-plans/${planId}/progress/${progressId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete progress entry");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting progress entry:", error);
    throw error;
  }
};

export const getProgressHistory = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/workout-plans/${planId}/progress`, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to get progress history");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching progress history:", error);
    throw error;
  }
};

// ─── Statistics ───────────────────────────────────────────────────────────────

export const getWorkoutStats = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/stats`, {
      method: "GET",
      headers,
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching workout stats:", error);
    throw error;
  }
};

export const getWeeklyProgress = async (planId, weekNumber) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/weeks/${weekNumber}/progress`,
      { method: "GET", headers }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    throw error;
  }
};

export const getAchievements = async (planId) => {
  try {
    const stats = await getWorkoutStats(planId);
    return stats.achievements || [];
  } catch (error) {
    console.error("Error fetching achievements:", error);
    throw error;
  }
};

export const getPersonalRecords = async (planId) => {
  try {
    const stats = await getWorkoutStats(planId);
    return stats.exerciseStats?.personalRecords || [];
  } catch (error) {
    console.error("Error fetching personal records:", error);
    throw error;
  }
};

export const exportProgressData = async (planId, format = "json") => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/export?format=${format}`,
      { method: "GET", headers }
    );
    return format === "csv" ? await response.text() : handleResponse(response);
  } catch (error) {
    console.error("Error exporting progress data:", error);
    throw error;
  }
};

// ─── Default export ───────────────────────────────────────────────────────────

const workoutSessionService = {
  getWorkoutPlan,
  batchAddExercisesToWorkout,
  startWorkoutSession,
  logExerciseSet,
  updateWorkoutStatus,
  updateExerciseProgress,
  saveWorkoutSessionProgress,
  saveWorkoutProgressLocally,
  getWorkoutSessionProgress,
  isWorkoutCompleted,
  completeWorkoutSession,
  addProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
  getProgressHistory,
  getWorkoutStats,
  getWeeklyProgress,
  getAchievements,
  getPersonalRecords,
  exportProgressData,
};

export default workoutSessionService;
