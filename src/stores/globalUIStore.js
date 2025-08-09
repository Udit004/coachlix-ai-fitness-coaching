// stores/globalUIStore.js - Global UI state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useGlobalUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Theme state
        theme: 'light',
        
        // Modal states
        modals: {
          createPlan: false,
          editPlan: false,
          addExercise: false,
          progress: false,
          settings: false,
        },
        
        // Loading states for global operations
        loadingStates: {
          auth: false,
          dataSync: false,
          backup: false,
        },
        
        // Notification/Toast state
        notifications: [],
        
        // Sidebar state (for mobile)
        sidebarOpen: false,
        
        // User preferences
        preferences: {
          autoSave: true,
          soundEnabled: true,
          notifications: true,
          metric: 'kg', // or 'lbs'
          restTimerSound: true,
          darkMode: 'auto', // 'light', 'dark', or 'auto'
        },
        
        // Recent activity (for quick access)
        recentActivity: [],
        
        // Search state
        searchState: {
          query: '',
          filters: {},
          recentSearches: [],
        },

        // Actions
        setTheme: (theme) => set({ theme }),
        
        // Modal actions
        openModal: (modalName) =>
          set((state) => ({
            modals: { ...state.modals, [modalName]: true },
          })),
        
        closeModal: (modalName) =>
          set((state) => ({
            modals: { ...state.modals, [modalName]: false },
          })),
        
        closeAllModals: () =>
          set((state) => ({
            modals: Object.keys(state.modals).reduce(
              (acc, key) => ({ ...acc, [key]: false }),
              {}
            ),
          })),
        
        // Loading actions
        setLoading: (operation, isLoading) =>
          set((state) => ({
            loadingStates: { ...state.loadingStates, [operation]: isLoading },
          })),
        
        // Notification actions
        addNotification: (notification) => {
          const id = Date.now().toString();
          const newNotification = {
            id,
            timestamp: new Date().toISOString(),
            ...notification,
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 10), // Keep only last 10
          }));
          
          // Auto remove after 5 seconds unless it's persistent
          if (!notification.persistent) {
            setTimeout(() => {
              get().removeNotification(id);
            }, 5000);
          }
          
          return id;
        },
        
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        
        clearNotifications: () => set({ notifications: [] }),
        
        // Sidebar actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        closeSidebar: () => set({ sidebarOpen: false }),
        
        // Preferences actions
        updatePreference: (key, value) =>
          set((state) => ({
            preferences: { ...state.preferences, [key]: value },
          })),
        
        updatePreferences: (newPreferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences },
          })),
        
        // Recent activity actions
        addRecentActivity: (activity) => {
          const newActivity = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...activity,
          };
          
          set((state) => ({
            recentActivity: [newActivity, ...state.recentActivity].slice(0, 20), // Keep only last 20
          }));
        },
        
        clearRecentActivity: () => set({ recentActivity: [] }),
        
        // Search actions
        setSearchQuery: (query) =>
          set((state) => ({
            searchState: { ...state.searchState, query },
          })),
        
        setSearchFilters: (filters) =>
          set((state) => ({
            searchState: { ...state.searchState, filters },
          })),
        
        addRecentSearch: (search) => {
          set((state) => ({
            searchState: {
              ...state.searchState,
              recentSearches: [
                search,
                ...state.searchState.recentSearches.filter((s) => s !== search),
              ].slice(0, 10), // Keep only last 10 searches
            },
          }));
        },
        
        clearRecentSearches: () =>
          set((state) => ({
            searchState: { ...state.searchState, recentSearches: [] },
          })),
        
        // Helper actions
        showSuccessNotification: (message) => {
          get().addNotification({
            type: 'success',
            message,
            icon: '✅',
          });
        },
        
        showErrorNotification: (message) => {
          get().addNotification({
            type: 'error',
            message,
            icon: '❌',
            persistent: true, // Error notifications stay until dismissed
          });
        },
        
        showInfoNotification: (message) => {
          get().addNotification({
            type: 'info',
            message,
            icon: 'ℹ️',
          });
        },
        
        showWarningNotification: (message) => {
          get().addNotification({
            type: 'warning',
            message,
            icon: '⚠️',
          });
        },
        
        // Bulk actions
        reset: () =>
          set({
            modals: {
              createPlan: false,
              editPlan: false,
              addExercise: false,
              progress: false,
              settings: false,
            },
            loadingStates: {
              auth: false,
              dataSync: false,
              backup: false,
            },
            notifications: [],
            sidebarOpen: false,
            searchState: {
              query: '',
              filters: {},
              recentSearches: [],
            },
          }),
      }),
      {
        name: 'global-ui-store',
        // Only persist preferences and recent activity
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
          recentActivity: state.recentActivity,
          searchState: {
            recentSearches: state.searchState.recentSearches,
          },
        }),
      }
    ),
    {
      name: 'global-ui-store',
    }
  )
);

export default useGlobalUIStore;