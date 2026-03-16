// Feature-level re-export for workout plan list service access.
// Feature-scoped workout plan service for plan list (CRUD, clone, toggle, AI generation).
// Shared infrastructure and exercise helpers are imported from workoutApiBase.
import {
  BASE_URL,
  getAuthHeaders,
  handleResponse,
  getWorkoutPlan,
  getWorkoutPlans,
  searchExercises,
  getPopularExercises,
} from "@/service/workoutApiBase";

export { getWorkoutPlan, getWorkoutPlans, searchExercises, getPopularExercises };

// ─── Plan CRUD ────────────────────────────────────────────────────────────────

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

export const togglePlanActive = async (planId, isActive) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/activate`, {
      method: isActive ? "POST" : "DELETE",
      headers,
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error toggling workout plan active status:", error);
    throw error;
  }
};

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

export const getWorkoutTemplates = async () =>
  getWorkoutPlans({ templatesOnly: true });

// ─── Default export ───────────────────────────────────────────────────────────

const workoutPlanService = {
  getWorkoutPlan,
  getWorkoutPlans,
  searchExercises,
  getPopularExercises,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  updateSpecificWorkoutPlan,
  deleteSpecificWorkoutPlan,
  cloneWorkoutPlan,
  togglePlanActive,
  generateAIWorkoutPlan,
  getWorkoutTemplates,
};

export default workoutPlanService;

