//- Better error handling and data structure
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkoutPlan,
  searchExercises,
  getPopularExercises,
} from '@/service/workoutApiBase';
import workoutSessionService from '@/feature/workout/session/services/workoutSessionService';
import { useAuth } from '@/hooks/useAuth';

const normalizeListOptions = (options = {}) => {
  const normalized = {};
  Object.keys(options)
    .sort()
    .forEach((key) => {
      const value = options[key];
      if (value !== undefined && value !== null && value !== '') {
        normalized[key] = value;
      }
    });
  return normalized;
};

// Query Keys (same as before)
export const workoutKeys = {
  all: ['workouts'],
  lists: () => [...workoutKeys.all, 'list'],
  list: (filters = {}) => [...workoutKeys.lists(), normalizeListOptions(filters)],
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

// Get single workout plan
export const useWorkoutPlan = (planId) => {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: workoutKeys.detail(planId),
    queryFn: () => getWorkoutPlan(planId),
    enabled: !!planId && !!user && !loading,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

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
    queryFn: () => searchExercises(query),
    enabled: !!query && query.length > 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get popular exercises
export const usePopularExercises = (category = null) => {
  return useQuery({
    queryKey: ['exercises', 'popular', category],
    queryFn: () => getPopularExercises(category),
    enabled: true,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Add progress entry (for body measurements, weight, etc.) - Keep this unchanged
export const useAddProgressEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, progressData }) => 
      workoutPlanService.addProgressEntry(planId, progressData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [...workoutKeys.progress(), variables.planId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.stats(variables.planId) 
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



// Update progress entry
export const useUpdateProgressEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, progressId, updateData }) => 
      workoutPlanService.updateProgressEntry(planId, progressId, updateData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [...workoutKeys.progress(), variables.planId] 
      });
    },
  });
};

// Delete progress entry
export const useDeleteProgressEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, progressId }) => 
      workoutPlanService.deleteProgressEntry(planId, progressId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [...workoutKeys.progress(), variables.planId] 
      });
    },
  });
};

