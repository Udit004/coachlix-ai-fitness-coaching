// feature/diet/detailDietPage/hooks/useDietPlanDetailQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dietPlanService from '../services/dietPlanService';
import { useAuth } from '@/hooks/useAuth';

// Query Keys - specific to detail page
export const DIET_PLAN_DETAIL_KEYS = {
  all: ['dietPlanDetail'],
  detail: (id) => [...DIET_PLAN_DETAIL_KEYS.all, 'detail', id],
  nutrition: (id) => [...DIET_PLAN_DETAIL_KEYS.all, 'nutrition', id],
};

// Hook to fetch single diet plan
export const useDietPlan = (planId) => {
  const authResult = useAuth();
  const user = authResult?.user || null;
  const authLoading = authResult?.loading || false;
  
  return useQuery({
    queryKey: DIET_PLAN_DETAIL_KEYS.detail(planId),
    queryFn: () => dietPlanService.getDietPlan(planId),
    enabled: !!user && !!planId && !authLoading,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Hook to fetch nutrition summary
export const useNutritionSummary = (planId) => {
  const authResult = useAuth();
  const user = authResult?.user || null;
  const authLoading = authResult?.loading || false;
  
  return useQuery({
    queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
    queryFn: () => dietPlanService.getNutritionSummary(planId),
    enabled: !!user && !!planId && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutation to delete diet plan
export const useDeleteDietPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dietPlanService.deleteDietPlan,
    onSuccess: (_, planId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: DIET_PLAN_DETAIL_KEYS.detail(planId) });
      queryClient.removeQueries({ queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId) });
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
      // Add cloned plan to cache
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(clonedPlan._id), clonedPlan);
    },
    onError: (error) => {
      console.error('Failed to clone diet plan:', error);
    },
  });
};

// Mutation to add day to diet plan
export const useAddDay = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, dayData }) => dietPlanService.addDay(planId, dayData),
    onSuccess: (updatedPlan, { planId }) => {
      // Set the data and mark as fresh
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(planId), updatedPlan);
      
      // Mark nutrition as stale without immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
        refetchType: 'none'
      });
    },
    onError: (error) => {
      console.error('Failed to add day:', error);
    },
  });
};

// Mutation to update day
export const useUpdateDay = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, dayNumber, dayData }) => 
      dietPlanService.updateDay(planId, dayNumber, dayData),
    onSuccess: (updatedPlan, { planId }) => {
      // Set the data and mark as fresh
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(planId), updatedPlan);
      // Mark nutrition as stale without immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
        refetchType: 'none'
      });
    },
    onError: (error) => {
      console.error('Failed to update day:', error);
    },
  });
};

// Mutation to add meal
export const useAddMeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, dayNumber, mealData }) => 
      dietPlanService.addMeal(planId, dayNumber, mealData),
    onSuccess: (updatedPlan, { planId }) => {
      // Set the data and mark as fresh
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(planId), updatedPlan);
      // Mark nutrition as stale without immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
        refetchType: 'none'
      });
    },
    onError: (error) => {
      console.error('Failed to add meal:', error);
    },
  });
};

// Mutation to add food item
export const useAddFoodItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, dayNumber, mealType, foodItem }) => 
      dietPlanService.addFoodItem(planId, dayNumber, mealType, foodItem),
    onSuccess: (updatedPlan, { planId }) => {
      // Set the data and mark as fresh (not stale)
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(planId), updatedPlan);
      // Mark nutrition as stale only - it will refetch when needed
      queryClient.invalidateQueries({ 
        queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
        refetchType: 'none'
      });
    },
    onError: (error) => {
      console.error('Failed to add food item:', error);
    },
  });
};

// Mutation to update food item
export const useUpdateFoodItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, dayNumber, mealType, itemIndex, foodItem }) => 
      dietPlanService.updateFoodItem(planId, dayNumber, mealType, itemIndex, foodItem),
    onSuccess: (updatedPlan, { planId }) => {
      // Set the data and mark as fresh (not stale)
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(planId), updatedPlan);
      // Mark nutrition as stale only - it will refetch when needed
      queryClient.invalidateQueries({ 
        queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
        refetchType: 'none'
      });
    },
    onError: (error) => {
      console.error('Failed to update food item:', error);
    },
  });
};

// Mutation to delete food item
export const useDeleteFoodItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, dayNumber, mealType, itemIndex }) => 
      dietPlanService.deleteFoodItem(planId, dayNumber, mealType, itemIndex),
    onSuccess: (updatedPlan, { planId }) => {
      // Set the data and mark as fresh (not stale)
      queryClient.setQueryData(DIET_PLAN_DETAIL_KEYS.detail(planId), updatedPlan);
      // Mark nutrition as stale only - it will refetch when needed
      queryClient.invalidateQueries({ 
        queryKey: DIET_PLAN_DETAIL_KEYS.nutrition(planId),
        refetchType: 'none'
      });
    },
    onError: (error) => {
      console.error('Failed to delete food item:', error);
    },
  });
};
