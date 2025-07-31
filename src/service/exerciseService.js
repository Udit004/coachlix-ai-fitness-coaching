// services/exerciseService.js
class ExerciseService {
  constructor() {
    this.baseURL = "/api/exercises";
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error occurred" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // GET /api/exercises - Get exercises with filtering and search
  async getExercises(options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.search) params.append("search", options.search);
      if (options.category) params.append("category", options.category);
      if (options.difficulty) params.append("difficulty", options.difficulty);
      if (options.equipment && options.equipment.length > 0) {
        params.append("equipment", options.equipment.join(","));
      }
      if (options.muscleGroups && options.muscleGroups.length > 0) {
        params.append("muscleGroups", options.muscleGroups.join(","));
      }
      if (options.popular) params.append("popular", "true");
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.page) params.append("page", options.page.toString());

      const url = `${this.baseURL}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }
  }

  // GET /api/exercises/[id] - Get specific exercise
  async getExercise(exerciseId) {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      throw error;
    }
  }

  // POST /api/exercises - Create new exercise
  async createExercise(exerciseData) {
    try {
      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(exerciseData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error creating exercise:", error);
      throw error;
    }
  }

  // PUT /api/exercises/[id] - Update exercise
  async updateExercise(exerciseId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error updating exercise:", error);
      throw error;
    }
  }

  // DELETE /api/exercises/[id] - Delete exercise
  async deleteExercise(exerciseId) {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw error;
    }
  }

  // POST /api/exercises/[id]/rate - Rate exercise
  async rateExercise(exerciseId, rating) {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}/rate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rating }),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error rating exercise:", error);
      throw error;
    }
  }

  // POST /api/exercises/[id]/favorite - Toggle favorite
  async toggleFavorite(exerciseId) {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}/favorite`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  }

  // GET /api/exercises/popular - Get popular exercises
  async getPopularExercises(limit = 20) {
    try {
      return this.getExercises({ popular: true, limit });
    } catch (error) {
      console.error("Error fetching popular exercises:", error);
      throw error;
    }
  }

  // GET /api/exercises/recommended - Get recommended exercises
  async getRecommendedExercises(userLevel, equipment, muscleGroups) {
    try {
      const params = new URLSearchParams();
      if (userLevel) params.append("difficulty", userLevel);
      if (equipment?.length > 0)
        params.append("equipment", equipment.join(","));
      if (muscleGroups?.length > 0)
        params.append("muscleGroups", muscleGroups.join(","));
      params.append("recommended", "true");

      const response = await fetch(
        `${this.baseURL}/recommended?${params.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching recommended exercises:", error);
      throw error;
    }
  }

  // GET /api/exercises/categories - Get exercise categories
  async getCategories() {
    try {
      const response = await fetch(`${this.baseURL}/categories`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // GET /api/exercises/muscle-groups - Get muscle groups
  async getMuscleGroups() {
    try {
      const response = await fetch(`${this.baseURL}/muscle-groups`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching muscle groups:", error);
      throw error;
    }
  }

  // GET /api/exercises/equipment - Get equipment list
  async getEquipment() {
    try {
      const response = await fetch(`${this.baseURL}/equipment`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      throw error;
    }
  }

  // Search exercises with advanced options
  async searchExercises(searchTerm, filters = {}) {
    try {
      return this.getExercises({
        search: searchTerm,
        ...filters,
      });
    } catch (error) {
      console.error("Error searching exercises:", error);
      throw error;
    }
  }

  // Filter exercises by category
  async getExercisesByCategory(category, additionalFilters = {}) {
    try {
      return this.getExercises({
        category,
        ...additionalFilters,
      });
    } catch (error) {
      console.error("Error fetching exercises by category:", error);
      throw error;
    }
  }

  // Filter exercises by muscle group
  async getExercisesByMuscleGroup(muscleGroup, additionalFilters = {}) {
    try {
      return this.getExercises({
        muscleGroups: [muscleGroup],
        ...additionalFilters,
      });
    } catch (error) {
      console.error("Error fetching exercises by muscle group:", error);
      throw error;
    }
  }

  // Filter exercises by equipment
  async getExercisesByEquipment(equipment, additionalFilters = {}) {
    try {
      return this.getExercises({
        equipment: Array.isArray(equipment) ? equipment : [equipment],
        ...additionalFilters,
      });
    } catch (error) {
      console.error("Error fetching exercises by equipment:", error);
      throw error;
    }
  }

  // Get exercises for workout plan creation
  async getExercisesForWorkout(
    workoutType,
    difficulty,
    muscleGroups,
    equipment,
    duration
  ) {
    try {
      const filters = {
        difficulty,
        limit: Math.ceil(duration / 10), // Rough estimate of exercises needed
      };

      if (workoutType === "Strength") {
        filters.category = "Strength";
      } else if (workoutType === "Cardio") {
        filters.category = "Cardio";
      }

      if (muscleGroups?.length > 0) {
        filters.muscleGroups = muscleGroups;
      }

      if (equipment?.length > 0) {
        filters.equipment = equipment;
      }

      return this.getExercises(filters);
    } catch (error) {
      console.error("Error fetching exercises for workout:", error);
      throw error;
    }
  }

  // Log exercise usage for analytics
  async logExerciseUsage(exerciseId, context = "workout") {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}/log-usage`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ context }),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error logging exercise usage:", error);
      // Don't throw error for analytics, just log it
    }
  }

  // Get exercise statistics
  async getExerciseStats(exerciseId) {
    try {
      const response = await fetch(`${this.baseURL}/${exerciseId}/stats`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching exercise stats:", error);
      throw error;
    }
  }

  // Get user's favorite exercises
  async getFavoriteExercises() {
    try {
      const response = await fetch(`${this.baseURL}/favorites`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching favorite exercises:", error);
      throw error;
    }
  }

  // Get user's exercise history
  async getExerciseHistory(exerciseId, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());

      const response = await fetch(
        `${this.baseURL}/${exerciseId}/history?${params.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching exercise history:", error);
      throw error;
    }
  }

  // Add this method to your ExerciseService class in exerciseService.js

  // AI-powered exercise search
  async searchExerciseWithAI(exerciseName) {
    try {
      const response = await fetch("/api/exercises/ai-search", {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ exerciseName }),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error("Error searching exercise with AI:", error);
      throw error;
    }
  }
}

const exerciseService = new ExerciseService();
export default exerciseService;
