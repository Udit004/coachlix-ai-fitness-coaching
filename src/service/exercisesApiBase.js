// Frontend exercises service - calls backend API
import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "@/service/apiBase";

export const EXERCISES_API_BASE_URL = `${API_BASE_URL}/exercises`;

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
 * Search exercises with filters
 */
export const searchExercises = async (options = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (options.search) params.append("search", options.search);
    if (options.category) params.append("category", options.category);
    if (options.difficulty) params.append("difficulty", options.difficulty);
    if (options.equipment) params.append("equipment", options.equipment);
    if (options.muscleGroups) params.append("muscleGroups", options.muscleGroups);
    if (options.popular) params.append("popular", options.popular);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.page) params.append("page", options.page.toString());

    const url = `${EXERCISES_API_BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { headers, cache: "no-store" });

    return handleResponse(response);
  } catch (error) {
    console.error("Error searching exercises:", error);
    throw error;
  }
};

/**
 * Generate exercise info using AI
 */
export const generateExerciseWithAI = async (exerciseName) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${EXERCISES_API_BASE_URL}/ai-search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ exerciseName }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error generating exercise with AI:", error);
    throw error;
  }
};

/**
 * Suggest exercises from external API
 */
export const suggestExercises = async (query) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${EXERCISES_API_BASE_URL}/suggest?q=${encodeURIComponent(query)}`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error suggesting exercises:", error);
    throw error;
  }
};

/**
 * Get exercise details
 */
export const getExerciseDetails = async (exerciseId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${EXERCISES_API_BASE_URL}/${exerciseId}`, {
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching exercise details:", error);
    throw error;
  }
};

/**
 * Get popular exercises
 */
export const getPopularExercises = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${EXERCISES_API_BASE_URL}?popular=true&limit=20`,
      { headers }
    );

    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching popular exercises:", error);
    throw error;
  }
};
