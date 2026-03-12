// feature/diet/list/hooks/useDietPlanListQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dietPlanService from '@/service/dietPlanService';
import { useAuth } from '@/hooks/useAuth';

// Query Keys
export const DIET_PLAN_KEYS = {
  all: ['dietPlans'],
  lists: () => [...DIET_PLAN_KEYS.all, 'list'],
  list: (filters) => [...DIET_PLAN_KEYS.lists(), filters],
  details: () => [...DIET_PLAN_KEYS.all, 'detail'],
  detail: (id) => [...DIET_PLAN_KEYS.details(), id],
  nutrition: (id) => [...DIET_PLAN_KEYS.all, 'nutrition', id],
};

// Hook to fetch all diet plans
export const useDietPlans = (options = {}) => {
  const authResult = useAuth();
  const user = authResult?.user || null;
  const authLoading = authResult?.loading || false;

  return useQuery({
    queryKey: DIET_PLAN_KEYS.list(options),
    queryFn: () => dietPlanService.getDietPlans(options),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // No select() — getDietPlans already returns a plain array.
    // Having select() here caused a structural-sharing bug: after a refetch the
    // memoised select result had the same reference as the previous selected
    // data, so React never re-rendered on the 2nd+ edit.
  });
};

// Mutation to create diet plan
export const useCreateDietPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietPlanService.createDietPlan,
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(newPlan._id || newPlan.id), newPlan);
    },
    onError: (error) => {
      console.error('Failed to create diet plan:', error);
    },
  });
};

// Mutation to update diet plan
export const useUpdateDietPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, updateData }) => dietPlanService.updateDietPlan(planId, updateData),
    onSuccess: (updatedPlan, { planId }) => {
      // Update the detail cache with the fresh server response.
      // The list query refetch is handled explicitly by the component via refetch()
      // to avoid TanStack Query structural sharing suppressing re-renders.
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
    },
    onError: (error) => {
      console.error('Failed to update diet plan:', error);
    },
  });
};

// Mutation to delete diet plan
export const useDeleteDietPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dietPlanService.deleteDietPlan,
    onSuccess: (_, planId) => {
      queryClient.removeQueries({ queryKey: DIET_PLAN_KEYS.detail(planId) });
      queryClient.removeQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete diet plan:', error);
    },
  });
};

// Mutation to clone diet plan
export const useCloneDietPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, newName }) => dietPlanService.cloneDietPlan(planId, newName),
    onSuccess: (clonedPlan) => {
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(clonedPlan._id), clonedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
    },
    onError: (error) => {
      console.error('Failed to clone diet plan:', error);
    },
  });
};

// Mutation to activate/deactivate diet plan
export const useToggleDietPlanActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, isActive }) => dietPlanService.togglePlanActive(planId, isActive),
    onSuccess: (updatedPlan, { planId }) => {
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
    },
    onError: (error) => {
      console.error('Failed to toggle diet plan active status:', error);
    },
  });
};
