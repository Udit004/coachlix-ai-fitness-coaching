// hooks/useDietPlanQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dietPlanService from '../service/dietPlanService';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();
  
  return useQuery({
    queryKey: DIET_PLAN_KEYS.list(options),
    queryFn: () => dietPlanService.getDietPlans(options),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      // Normalize the response structure
      const plans = data && Array.isArray(data.plans) ? data.plans : Array.isArray(data) ? data : [];
      return plans;
    },
  });
};

// Hook to fetch single diet plan
export const useDietPlan = (planId) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: DIET_PLAN_KEYS.detail(planId),
    queryFn: () => dietPlanService.getDietPlan(planId),
    enabled: !!user && !!planId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Hook to fetch nutrition summary
export const useNutritionSummary = (planId) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: DIET_PLAN_KEYS.nutrition(planId),
    queryFn: () => dietPlanService.getNutritionSummary(planId),
    enabled: !!user && !!planId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutation to create diet plan
export const useCreateDietPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dietPlanService.createDietPlan,
    onSuccess: (newPlan) => {
      // Invalidate and refetch diet plans list
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
      
      // Optionally add the new plan to the cache
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
      // Update the specific plan in cache
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
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
      // Remove from cache
      queryClient.removeQueries({ queryKey: DIET_PLAN_KEYS.detail(planId) });
      queryClient.removeQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
      
      // Invalidate lists
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
      // Add cloned plan to cache
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(clonedPlan._id), clonedPlan);
      
      // Invalidate lists to show the new plan
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
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
      // Update the plan in cache
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      
      // Invalidate nutrition summary as it may have changed
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
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
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
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
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
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
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
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
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
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
      queryClient.setQueryData(DIET_PLAN_KEYS.detail(planId), updatedPlan);
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.nutrition(planId) });
    },
    onError: (error) => {
      console.error('Failed to delete food item:', error);
    },
  });
};

// Mutation to generate AI plan
export const useGenerateAIPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dietPlanService.generateAIPlan,
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: DIET_PLAN_KEYS.lists() });
      if (newPlan._id) {
        queryClient.setQueryData(DIET_PLAN_KEYS.detail(newPlan._id), newPlan);
      }
    },
    onError: (error) => {
      console.error('Failed to generate AI plan:', error);
    },
  });
};