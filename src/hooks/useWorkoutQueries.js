// hooks/useWorkoutQueries.js - React Query hooks for workout data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import workoutPlanService from '@/service/workoutPlanService';
import { useAuth } from '@/hooks/useAuth';

// Query Keys
export const workoutKeys = {
  all: ['workouts'],
  lists: () => [...workoutKeys.all, 'list'],
  list: (filters) => [...workoutKeys.lists(), { filters }],
  details: () => [...workoutKeys.all, 'detail'],
  detail: (id) => [...workoutKeys.details(), id],
  sessions: () => [...workoutKeys.all, 'sessions'],
  session: (planId, weekNumber, dayNumber, workoutId) => [
    ...workoutKeys.sessions(), 
    { planId, weekNumber, dayNumber, workoutId }
  ],
  progress: () => [...workoutKeys.all, 'progress'],
  stats: (planId) => [...workoutKeys.all, 'stats', planId],
};

// Get all workout plans
export const useWorkoutPlans = (options = {}) => {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: workoutKeys.list(JSON.stringify(options)),
    queryFn: () => user ? workoutPlanService.getWorkoutPlans(options) : Promise.resolve([]),
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single workout plan
export const useWorkoutPlan = (planId) => {
  return useQuery({
    queryKey: workoutKeys.detail(planId),
    queryFn: () => workoutPlanService.getWorkoutPlan(planId),
    enabled: !!planId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get specific workout session data
export const useWorkoutSession = (planId, weekNumber, dayNumber, workoutId) => {
  return useQuery({
    queryKey: workoutKeys.session(planId, weekNumber, dayNumber, workoutId),
    queryFn: async () => {
      // Get the full plan first
      const response = await workoutPlanService.getWorkoutPlan(planId);
      const plan = response.plan || response;
      
      // Find the specific workout
      const week = plan.weeks?.find((w) => w.weekNumber === weekNumber);
      const day = week?.days?.find((d) => d.dayNumber === dayNumber);
      const workout = day?.workouts?.find(
        (w, index) =>
          w._id === workoutId ||
          w.id === workoutId ||
          index.toString() === workoutId ||
          index === parseInt(workoutId)
      );

      if (!workout) {
        throw new Error("Workout not found");
      }

      return { plan, workout };
    },
    enabled: !!(planId && weekNumber && dayNumber && workoutId),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get workout statistics
export const useWorkoutStats = (planId) => {
  return useQuery({
    queryKey: workoutKeys.stats(planId),
    queryFn: () => workoutPlanService.getWorkoutStats(planId),
    enabled: !!planId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get progress history
export const useProgressHistory = (planId) => {
  return useQuery({
    queryKey: [...workoutKeys.progress(), planId],
    queryFn: () => workoutPlanService.getProgressHistory(planId),
    enabled: !!planId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Search exercises
export const useExerciseSearch = (query) => {
  return useQuery({
    queryKey: ['exercises', 'search', query],
    queryFn: () => workoutPlanService.searchExercises(query),
    enabled: !!query && query.length > 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get popular exercises
export const usePopularExercises = (category = null) => {
  return useQuery({
    queryKey: ['exercises', 'popular', category],
    queryFn: () => workoutPlanService.getPopularExercises(category),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// ===== MUTATIONS =====

// Create workout plan
export const useCreateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workoutPlanService.createWorkoutPlan,
    onSuccess: (data) => {
      // Invalidate and refetch workout plans
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
      
      // Add the new plan to the cache
      if (data.plan) {
        queryClient.setQueryData(
          workoutKeys.detail(data.plan._id || data.plan.id),
          { plan: data.plan }
        );
      }
    },
  });
};

// Update workout plan
export const useUpdateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, updateData }) => 
      workoutPlanService.updateWorkoutPlan(planId, updateData),
    onSuccess: (data, variables) => {
      // Update the plan in cache
      queryClient.setQueryData(
        workoutKeys.detail(variables.planId),
        { plan: data.plan || data }
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
};

// Delete workout plan
export const useDeleteWorkoutPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workoutPlanService.deleteWorkoutPlan,
    onSuccess: (data, planId) => {
      // Remove from all relevant caches
      queryClient.removeQueries({ queryKey: workoutKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
};

// Clone workout plan
export const useCloneWorkoutPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, newName }) => 
      workoutPlanService.cloneWorkoutPlan(planId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
};

// Add exercises to workout
export const useAddExercisesToWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId, exercises }) =>
      workoutPlanService.batchAddExercisesToWorkout(
        planId, 
        weekNumber, 
        dayNumber, 
        workoutId, 
        exercises
      ),
    onSuccess: (data, variables) => {
      // Invalidate the specific workout plan to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.detail(variables.planId) 
      });
      
      // Invalidate session data
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.session(
          variables.planId,
          variables.weekNumber,
          variables.dayNumber,
          variables.workoutId
        ) 
      });
    },
  });
};

// Save workout progress
export const useSaveWorkoutProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId, exerciseData }) => {
      // Save individual exercise progress
      const promises = Object.entries(exerciseData).map(([index, data]) => {
        if (data.sets.length > 0 || data.completed || data.notes) {
          return workoutPlanService.updateExerciseProgress(
            planId,
            weekNumber,
            dayNumber,
            index, // Using index as workout index
            index, // Using index as exercise index
            {
              completedSets: data.sets,
              isCompleted: data.completed,
              notes: data.notes,
            }
          );
        }
        return Promise.resolve();
      });
      
      return Promise.all(promises);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.detail(variables.planId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.session(
          variables.planId,
          variables.weekNumber,
          variables.dayNumber,
          variables.workoutId
        ) 
      });
    },
  });
};

// Complete workout session
export const useCompleteWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId, sessionData }) =>
      workoutPlanService.completeWorkoutSession(
        planId, 
        weekNumber, 
        dayNumber, 
        workoutId, 
        sessionData
      ),
    onSuccess: (data, variables) => {
      // Invalidate all related data
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.detail(variables.planId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.stats(variables.planId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.progress() 
      });
    },
  });
};

// Start workout session
export const useStartWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId }) =>
      workoutPlanService.startWorkoutSession(
        planId, 
        weekNumber, 
        dayNumber, 
        workoutId
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.detail(variables.planId) 
      });
    },
  });
};