// stores/useDietPlanStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useDietPlanStore = create(
  devtools(
    (set, get) => ({
      // UI State only
      selectedPlanId: null,
      searchTerm: "",
      selectedGoal: "",
      sortBy: "newest",
      activeDay: 1,
      showCreateModal: false,
      showEditModal: false,
      
      // UI Actions
      setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedGoal: (goal) => set({ selectedGoal: goal }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setActiveDay: (day) => set({ activeDay: day }),
      setShowCreateModal: (show) => set({ showCreateModal: show }),
      setShowEditModal: (show) => set({ showEditModal: show }),
      
      // Reset UI state
      resetUI: () => set({
        selectedPlanId: null,
        searchTerm: "",
        selectedGoal: "",
        sortBy: "newest",
        activeDay: 1,
        showCreateModal: false,
        showEditModal: false,
      }),
      
      // Reset search and filters
      resetFilters: () => set({
        searchTerm: "",
        selectedGoal: "",
        sortBy: "newest",
      }),
    }),
    {
      name: 'diet-plan-ui-store',
    }
  )
);

export default useDietPlanStore;