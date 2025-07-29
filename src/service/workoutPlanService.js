// service/workoutPlanService.js
import { auth } from "@/lib/firebase";

class WorkoutPlanService {
  constructor() {
    this.baseURL = '/api/workout-plans';
  }

  // Helper method to get auth headers
async getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
  

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // GET /api/workout-plans - Get all workout plans
  async getWorkoutPlans(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.activeOnly) params.append('active', 'true');
      if (options.goal) params.append('goal', options.goal);
      if (options.difficulty) params.append('difficulty', options.difficulty);
      if (options.templatesOnly) params.append('templates', 'true');
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sort) params.append('sort', options.sort);

      const url = `${this.baseURL}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      throw error;
    }
  }

  // POST /api/workout-plans - Create new workout plan
  async createWorkoutPlan(planData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(planData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating workout plan:', error);
      throw error;
    }
  }

  // PUT /api/workout-plans - Update workout plan
  async updateWorkoutPlan(planId, updateData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ planId, ...updateData }),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }
  }

  // DELETE /api/workout-plans - Delete workout plan
  async deleteWorkoutPlan(planId) {
    try {
      const response = await fetch(`${this.baseURL}?planId=${planId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  // GET /api/workout-plans/[id] - Get specific workout plan
  async getWorkoutPlan(planId) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching workout plan:', error);
      throw error;
    }
  }

  // PUT /api/workout-plans/[id] - Update specific workout plan
  async updateSpecificWorkoutPlan(planId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }
  }

  // DELETE /api/workout-plans/[id] - Delete specific workout plan
  async deleteSpecificWorkoutPlan(planId) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  // POST /api/workout-plans/[id]/weeks - Add week to plan
  async addWeekToPlan(planId, weekData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(weekData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error adding week to plan:', error);
      throw error;
    }
  }

  // PUT /api/workout-plans/[id]/weeks/[weekNumber] - Update specific week
  async updateWeek(planId, weekNumber, weekData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(weekData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating week:', error);
      throw error;
    }
  }

  // POST /api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts - Add workout to day
  async addWorkoutToDay(planId, weekNumber, dayNumber, workoutData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(workoutData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error adding workout to day:', error);
      throw error;
    }
  }

  // POST /api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/exercises - Add exercise to workout
  async addExerciseToWorkout(planId, weekNumber, dayNumber, workoutId, exerciseData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(exerciseData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      throw error;
    }
  }

  // PUT /api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/exercises/[exerciseId] - Update exercise
  async updateExercise(planId, weekNumber, dayNumber, workoutId, exerciseId, exerciseData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(exerciseData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }

  // DELETE /api/workout-plans/[id]/weeks/[weekNumber]/days/[dayNumber]/workouts/[workoutId]/exercises/[exerciseId] - Delete exercise
  async deleteExercise(planId, weekNumber, dayNumber, workoutId, exerciseId) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }

  // POST /api/workout-plans/[id]/progress - Add progress entry
  async addProgressEntry(planId, progressData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/progress`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(progressData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error adding progress entry:', error);
      throw error;
    }
  }

  // GET /api/workout-plans/[id]/progress - Get progress history
  async getProgressHistory(planId) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/progress`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching progress history:', error);
      throw error;
    }
  }

  // Clone workout plan
  async cloneWorkoutPlan(planId, newName) {
    try {
      const originalPlan = await this.getWorkoutPlan(planId);
      
      const clonedPlanData = {
        name: newName,
        description: `Copy of ${originalPlan.name}`,
        goal: originalPlan.goal,
        difficulty: originalPlan.difficulty,
        duration: originalPlan.duration,
        workoutFrequency: originalPlan.workoutFrequency,
        weeks: originalPlan.weeks,
        targetMuscleGroups: originalPlan.targetMuscleGroups,
        equipment: originalPlan.equipment,
        tags: [...(originalPlan.tags || []), 'cloned'],
        createdBy: 'user',
        templateId: originalPlan._id
      };

      return this.createWorkoutPlan(clonedPlanData);
    } catch (error) {
      console.error('Error cloning workout plan:', error);
      throw error;
    }
  }

  // Get workout templates
  async getWorkoutTemplates() {
    try {
      return this.getWorkoutPlans({ templatesOnly: true });
    } catch (error) {
      console.error('Error fetching workout templates:', error);
      throw error;
    }
  }

  // Start workout session
  async startWorkoutSession(planId, weekNumber, dayNumber, workoutId) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/start`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error starting workout session:', error);
      throw error;
    }
  }

  // Complete workout session
  async completeWorkoutSession(planId, weekNumber, dayNumber, workoutId, sessionData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/complete`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(sessionData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error completing workout session:', error);
      throw error;
    }
  }

  // Log exercise set
  async logExerciseSet(planId, weekNumber, dayNumber, workoutId, exerciseId, setData) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/weeks/${weekNumber}/days/${dayNumber}/workouts/${workoutId}/exercises/${exerciseId}/sets`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(setData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error logging exercise set:', error);
      throw error;
    }
  }

  // Get workout statistics
  async getWorkoutStats(planId) {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/stats`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      throw error;
    }
  }
}

const workoutPlanService = new WorkoutPlanService();
export default workoutPlanService;