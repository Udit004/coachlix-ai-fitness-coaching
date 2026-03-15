import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workoutPlanService from "../services/workoutPlanService";
import { useAuth } from "@/hooks/useAuth";
import { workoutKeys } from "@/hooks/useWorkoutQueries";

// ─── Query ────────────────────────────────────────────────────────────────────

export const useWorkoutPlan = (planId) => {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: workoutKeys.detail(planId),
    queryFn: () => workoutPlanService.getWorkoutPlan(planId),
    enabled: !!planId && !!user && !loading,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useUpdateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, updateData }) =>
      workoutPlanService.updateWorkoutPlan(planId, updateData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(workoutKeys.detail(variables.planId), {
        plan: data.plan || data,
      });
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
};

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
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.planId),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.session(
          variables.planId,
          variables.weekNumber,
          variables.dayNumber,
          variables.workoutId
        ),
      });
    },
  });
};

export const useUpdateExerciseTargets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      exerciseIndex,
      targetUpdates,
    }) =>
      workoutPlanService.updateExerciseTargetsInWorkout(
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseIndex,
        targetUpdates
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.planId),
      });
      queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() });
    },
  });
};

export const useDeleteExerciseFromWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId, exerciseIndex }) =>
      workoutPlanService.deleteExerciseFromWorkout(
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseIndex
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.planId),
      });
      queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.stats(variables.planId),
      });
    },
  });
};

export const useDeleteWorkoutFromDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId }) =>
      workoutPlanService.deleteWorkoutFromDay(
        planId,
        weekNumber,
        dayNumber,
        workoutId
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.planId),
      });
      queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.stats(variables.planId),
      });
    },
  });
};

export const useClearWorkoutDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber }) =>
      workoutPlanService.clearDayWorkouts(planId, weekNumber, dayNumber),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.planId),
      });
      queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.stats(variables.planId),
      });
    },
  });
};
