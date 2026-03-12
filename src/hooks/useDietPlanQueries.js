// hooks/useDietPlanQueries.js
// Re-exports commonly used diet plan hooks for app-wide usage
// Feature-specific hooks should import from their respective feature folders

export { 
  useDietPlans,
  useCreateDietPlan,
  useUpdateDietPlan,
  useDeleteDietPlan,
  useCloneDietPlan,
  useAddDay,
  useUpdateDay,
  useAddMeal,
  useAddFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
  useGenerateAIPlan,
  useToggleDietPlanActive,
  DIET_PLAN_KEYS,
} from '@/feature/diet/dietlist/hooks/useDietPlanListQueries';

export {
  useDietPlan,
  useNutritionSummary,
  DIET_PLAN_DETAIL_KEYS,
} from '@/feature/diet/detailDietPage/hooks/useDietPlanDetailQueries';
