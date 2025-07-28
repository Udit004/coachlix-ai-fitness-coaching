// services/dietPlanService.js
import { auth } from "@/lib/firebase";

const BASE_URL = "/api/diet-plans";

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

// Get all diet plans for current user
export const getDietPlans = async (options = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (options.activeOnly) params.append("active", "true");
    if (options.goal) params.append("goal", options.goal);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.sort) params.append("sort", options.sort);

    const url = `${BASE_URL}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await fetch(url, { headers });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching diet plans:", error);
    throw error;
  }
};

// Get single diet plan by ID
export const getDietPlan = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}`, { headers });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    throw error;
  }
};

// Create new diet plan
export const createDietPlan = async (planData) => {
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
    console.error("Error creating diet plan:", error);
    throw error;
  }
};

// Update diet plan
export const updateDietPlan = async (planId, updateData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating diet plan:", error);
    throw error;
  }
};

// Delete diet plan
export const deleteDietPlan = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}`, {
      method: "DELETE",
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    throw error;
  }
};

// Add day to diet plan
export const addDay = async (planId, dayData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/days`, {
      method: "POST",
      headers,
      body: JSON.stringify(dayData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding day to diet plan:", error);
    throw error;
  }
};

// Update specific day
export const updateDay = async (planId, dayNumber, dayData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/days/${dayNumber}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(dayData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating day:", error);
    throw error;
  }
};

// Add meal to specific day
export const addMeal = async (planId, dayNumber, mealData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/days/${dayNumber}/meals`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(mealData),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding meal:", error);
    throw error;
  }
};

// Add food item to meal
export const addFoodItem = async (planId, dayNumber, mealType, foodItem) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/days/${dayNumber}/meals/${mealType}/items`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(foodItem),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error adding food item:", error);
    throw error;
  }
};

// Update food item
export const updateFoodItem = async (
  planId,
  dayNumber,
  mealType,
  itemIndex,
  foodItem
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/days/${dayNumber}/meals/${mealType}/items/${itemIndex}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(foodItem),
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error updating food item:", error);
    throw error;
  }
};

// Delete food item
export const deleteFoodItem = async (
  planId,
  dayNumber,
  mealType,
  itemIndex
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/${planId}/days/${dayNumber}/meals/${mealType}/items/${itemIndex}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting food item:", error);
    throw error;
  }
};

// Generate AI diet plan
export const generateAIPlan = async (preferences) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/generate-ai`, {
      method: "POST",
      headers,
      body: JSON.stringify(preferences),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error generating AI diet plan:", error);
    throw error;
  }
};

// Clone existing diet plan
export const cloneDietPlan = async (planId, newName) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/clone`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newName }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error cloning diet plan:", error);
    throw error;
  }
};

// Get nutrition summary for a plan
export const getNutritionSummary = async (planId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/${planId}/nutrition-summary`, {
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error getting nutrition summary:", error);
    throw error;
  }
};

// Search food database
export const searchFoods = async (query) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `/api/foods/search?q=${encodeURIComponent(query)}`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error searching foods:", error);
    throw error;
  }
};

// Get popular foods
export const getPopularFoods = async (category = null) => {
  try {
    const headers = await getAuthHeaders();
    const url = category
      ? `/api/foods/popular?category=${category}`
      : "/api/foods/popular";
    const response = await fetch(url, { headers });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching popular foods:", error);
    throw error;
  }
};

// Add this method to your dietPlanService.js file

export const getFoodDetailsWithAI = async (foodName) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch("/api/foods/popular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "get_details",
        foodName: foodName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Service: Error getting AI food details:", error);
    throw error;
  }
};

// Default export with all functions for convenience
const dietPlanService = {
  getDietPlans,
  getDietPlan,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
  addDay,
  updateDay,
  addMeal,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  generateAIPlan,
  cloneDietPlan,
  getNutritionSummary,
  searchFoods,
  getPopularFoods,
  getFoodDetailsWithAI,
};

export default dietPlanService;
