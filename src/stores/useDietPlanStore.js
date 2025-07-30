// stores/useDietPlanStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import dietPlanService from '../service/dietPlanService';

const useDietPlanStore = create(
  devtools(
    (set, get) => ({
      // State
      dietPlans: [],
      currentPlan: null,
      loading: false,
      error: null,
      
      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Fetch all diet plans
      fetchDietPlans: async (options = {}) => {
        set({ loading: true, error: null });
        try {
          const data = await dietPlanService.getDietPlans(options);
          const plans = data && Array.isArray(data.plans) ? data.plans : Array.isArray(data) ? data : [];
          set({ dietPlans: plans, loading: false });
          return plans;
        } catch (error) {
          set({ error: error?.message || 'Failed to fetch diet plans', loading: false, dietPlans: [] });
          throw error;
        }
      },
      
      // Fetch single diet plan
      fetchDietPlan: async (planId) => {
        set({ loading: true, error: null });
        try {
          const plan = await dietPlanService.getDietPlan(planId);
          set({ currentPlan: plan, loading: false });
          return plan;
        } catch (error) {
          set({ error: error?.message || 'Failed to fetch diet plan', loading: false });
          throw error;
        }
      },
      
      // Create new diet plan
      createDietPlan: async (planData) => {
        set({ error: null });
        try {
          const response = await dietPlanService.createDietPlan(planData);
          const newPlan = response.plan || response;
          
          const planWithDefaults = {
            _id: newPlan._id || newPlan.id,
            name: newPlan.name,
            description: newPlan.description || '',
            goal: newPlan.goal,
            tags: Array.isArray(newPlan.tags) ? newPlan.tags : [],
            isActive: newPlan.isActive !== undefined ? newPlan.isActive : true,
            targetCalories: newPlan.targetCalories,
            targetProtein: newPlan.targetProtein || 0,
            targetCarbs: newPlan.targetCarbs || 0,
            targetFats: newPlan.targetFats || 0,
            duration: newPlan.duration,
            difficulty: newPlan.difficulty || 'Beginner',
            createdAt: newPlan.createdAt || new Date().toISOString(),
          };
          
          set((state) => ({
            dietPlans: [planWithDefaults, ...state.dietPlans]
          }));
          
          return planWithDefaults;
        } catch (error) {
          set({ error: error?.message || 'Failed to create plan' });
          throw error;
        }
      },
      
      // Delete diet plan
      deleteDietPlan: async (planId) => {
        set({ error: null });
        try {
          await dietPlanService.deleteDietPlan(planId);
          set((state) => ({
            dietPlans: state.dietPlans.filter(plan => plan && plan._id !== planId),
            currentPlan: state.currentPlan?._id === planId ? null : state.currentPlan
          }));
        } catch (error) {
          set({ error: error?.message || 'Failed to delete plan' });
          throw error;
        }
      },
      
      // Clone diet plan
      cloneDietPlan: async (planId, newName) => {
        set({ error: null });
        try {
          const clonedPlan = await dietPlanService.cloneDietPlan(planId, newName);
          if (clonedPlan) {
            set((state) => ({
              dietPlans: [clonedPlan, ...state.dietPlans]
            }));
          }
          return clonedPlan;
        } catch (error) {
          set({ error: error?.message || 'Failed to clone plan' });
          throw error;
        }
      },
      
      // Add day to current plan
      addDay: async (planId, dayData) => {
        set({ error: null });
        try {
          const updatedPlan = await dietPlanService.addDay(planId, dayData);
          set({ currentPlan: updatedPlan });
          return updatedPlan;
        } catch (error) {
          set({ error: error?.message || 'Failed to add day' });
          throw error;
        }
      },
      
      // Clear current plan
      clearCurrentPlan: () => set({ currentPlan: null }),
      
      // Reset store
      reset: () => set({
        dietPlans: [],
        currentPlan: null,
        loading: false,
        error: null
      }),
    }),
    {
      name: 'diet-plan-store',
    }
  )
);

export default useDietPlanStore;