// Frontend foods service - calls backend API
import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "@/service/apiBase";

export const FOODS_API_BASE_URL = `${API_BASE_URL}/foods`;

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

/**
 * Get popular foods
 */
export const getPopularFoods = async (category = null) => {
  try {
    const headers = await getAuthHeaders();
    const url = category
      ? `${FOODS_API_BASE_URL}/popular?category=${category}`
      : `${FOODS_API_BASE_URL}/popular`;

    const response = await fetch(url, { headers, cache: "no-store" });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching popular foods:", error);
    throw error;
  }
};

/**
 * Search foods by query
 */
export const searchFoods = async (query, category = null) => {
  try {
    const headers = await getAuthHeaders();
    let url = `${FOODS_API_BASE_URL}/search?q=${encodeURIComponent(query)}`;

    if (category) {
      url += `&category=${category}`;
    }

    const response = await fetch(url, { headers, cache: "no-store" });

    return handleResponse(response);
  } catch (error) {
    console.error("Error searching foods:", error);
    throw error;
  }
};

/**
 * Get food details
 */
export const getFoodDetails = async (foodName) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${FOODS_API_BASE_URL}/${encodeURIComponent(foodName)}`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching food details:", error);
    throw error;
  }
};

/**
 * Get foods by category
 */
export const getFoodsByCategory = async (category) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${FOODS_API_BASE_URL}/category/${encodeURIComponent(category)}`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching foods by category:", error);
    throw error;
  }
};

/**
 * Get nutrition info for food
 */
export const getNutritionInfo = async (foodName, servingSize = 1) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${FOODS_API_BASE_URL}/nutrition/${encodeURIComponent(foodName)}?servingSize=${servingSize}`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching nutrition info:", error);
    throw error;
  }
};
