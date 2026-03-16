import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workoutPlanService from "../services/workoutPlanService";
import { useAuth } from "@/hooks/useAuth";
import { workoutKeys } from "@/hooks/useWorkoutQueries";

// Re-export workoutKeys so consumers of this file (e.g. app/workout-plan/page.jsx)
// can import it from here without touching the global hooks file.
export { workoutKeys };

const normalizeListOptions = (options = {}) => {
  const normalized = {};
  Object.keys(options)
    .sort()
    .forEach((key) => {
      const value = options[key];
      if (value !== undefined && value !== null && value !== "") {
        normalized[key] = value;
      }
    });
  return normalized;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useWorkoutPlans = (options = {}) => {
  const { user, loading } = useAuth();
  const normalizedOptions = normalizeListOptions(options);

  return useQuery({
    queryKey: workoutKeys.list(normalizedOptions),
    queryFn: () =>
      user
        ? workoutPlanService.getWorkoutPlans(normalizedOptions)
        : Promise.resolve([]),
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workoutPlanService.createWorkoutPlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
      if (data.plan) {
        queryClient.setQueryData(
          workoutKeys.detail(data.plan._id || data.plan.id),
          { plan: data.plan }
        );
      }
    },
  });
};

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

export const useDeleteWorkoutPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workoutPlanService.deleteWorkoutPlan,
    onSuccess: (data, planId) => {
      queryClient.removeQueries({ queryKey: workoutKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
    onError: (error) => {
      console.error("Failed to delete workout plan:", error);
    },
  });
};

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

export const useToggleWorkoutPlanActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, isActive }) =>
      workoutPlanService.togglePlanActive(planId, isActive),
    onSuccess: (response, { planId }) => {
      const updatedPlan = response?.plan || response;
      queryClient.setQueryData(workoutKeys.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
    onError: (error) => {
      console.error("Failed to toggle workout plan active status:", error);
    },
  });
};
