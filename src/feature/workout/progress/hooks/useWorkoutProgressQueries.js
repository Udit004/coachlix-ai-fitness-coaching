import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { workoutKeys } from "@/hooks/useWorkoutQueries";
import workoutProgressService from "../services/workoutProgressService";

export const useWorkoutProgressPlan = (planId) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: workoutKeys.detail(planId),
    queryFn: () => workoutProgressService.getWorkoutProgressPlan(planId),
    enabled: !!planId && !!user && !loading,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useWorkoutProgressHistory = (planId) => {
  return useQuery({
    queryKey: [...workoutKeys.progress(), planId],
    queryFn: () => workoutProgressService.getProgressHistory(planId),
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useWorkoutProgressStats = (planId) => {
  return useQuery({
    queryKey: workoutKeys.stats(planId),
    queryFn: () => workoutProgressService.getWorkoutStats(planId),
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
  });
};
