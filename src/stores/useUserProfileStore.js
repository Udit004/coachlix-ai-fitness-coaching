// stores/useUserProfileStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { userProfileService } from '@/service/userProfileService';

const useUserProfileStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        profile: null,
        loading: false,
        error: null,
        lastFetched: null,
        
        // Actions
        setProfile: (profile) => 
          set({ 
            profile, 
            error: null, 
            lastFetched: Date.now() 
          }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error, loading: false }),

        clearError: () => set({ error: null }),

        // Fetch user profile with smart caching
        fetchUserProfile: async (userId, options = {}) => {
          const { 
            force = false, // Force refresh even if cached
            maxAge = 5 * 60 * 1000 // 5 minutes cache by default
          } = options;

          const state = get();
          
          // Skip if already loading
          if (state.loading && !force) {
            return state.profile;
          }

          // Check if we have fresh cached data
          if (!force && state.profile && state.lastFetched) {
            const isDataFresh = Date.now() - state.lastFetched < maxAge;
            if (isDataFresh) {
              console.log('📦 Using cached profile data');
              return state.profile;
            }
          }

          // Set loading state
          set({ loading: true, error: null });

          try {
            console.log('🔄 Fetching user profile from API...');
            const profileData = await userProfileService.getUserProfile(userId);
            
            set({ 
              profile: profileData, 
              loading: false, 
              error: null,
              lastFetched: Date.now()
            });

            console.log('✅ Profile fetched successfully');
            return profileData;
          } catch (error) {
            console.error('❌ Failed to fetch profile:', error);
            set({ 
              error: error.message || 'Failed to fetch profile', 
              loading: false 
            });
            throw error;
          }
        },

        // Update profile both locally and on server
        updateProfile: async (userId, updates) => {
          const state = get();
          
          // Optimistic update
          const previousProfile = state.profile;
          const updatedProfile = { ...previousProfile, ...updates };
          
          set({ 
            profile: updatedProfile, 
            loading: true, 
            error: null 
          });

          try {
            console.log('🔄 Updating profile on server...');
            const serverProfile = await userProfileService.updateUserProfile(userId, updates);
            
            set({ 
              profile: serverProfile, 
              loading: false, 
              lastFetched: Date.now() 
            });

            console.log('✅ Profile updated successfully');
            return serverProfile;
          } catch (error) {
            console.error('❌ Failed to update profile:', error);
            
            // Revert optimistic update on error
            set({ 
              profile: previousProfile, 
              error: error.message || 'Failed to update profile',
              loading: false 
            });
            
            throw error;
          }
        },

        // Refresh profile data
        refreshProfile: async (userId) => {
          return get().fetchUserProfile(userId, { force: true });
        },

        // Clear profile data (useful for logout)
        clearProfile: () => 
          set({ 
            profile: null, 
            loading: false, 
            error: null, 
            lastFetched: null 
          }),

        // Check if profile exists and is valid
        hasValidProfile: () => {
          const state = get();
          return !!(state.profile && state.profile.id);
        },

        // Get profile age in milliseconds
        getProfileAge: () => {
          const state = get();
          return state.lastFetched ? Date.now() - state.lastFetched : Infinity;
        },

        // Upload profile image
        uploadProfileImage: async (userId, imageFile) => {
          const state = get();
          set({ loading: true, error: null });

          try {
            console.log('🔄 Uploading profile image...');
            const imageUrl = await userProfileService.uploadProfileImage(userId, imageFile);
            
            // Update profile with new image URL
            const updatedProfile = { 
              ...state.profile, 
              profileImage: imageUrl 
            };
            
            set({ 
              profile: updatedProfile, 
              loading: false, 
              lastFetched: Date.now() 
            });

            console.log('✅ Profile image uploaded successfully');
            return imageUrl;
          } catch (error) {
            console.error('❌ Failed to upload image:', error);
            set({ 
              error: error.message || 'Failed to upload image',
              loading: false 
            });
            throw error;
          }
        }
      }),
      {
        name: 'coachlix-user-profile', // localStorage key
        storage: createJSONStorage(() => localStorage),
        
        // Only persist specific fields (exclude loading states)
        partialize: (state) => ({
          profile: state.profile,
          lastFetched: state.lastFetched
        }),

        // Version for migration if needed
        version: 1,

        // Handle rehydration
        onRehydrateStorage: () => (state) => {
          console.log('🔄 Rehydrating user profile store...');
          if (state?.profile) {
            console.log('✅ Profile data restored from localStorage');
          }
        }
      }
    )
  )
);

// Auto-refetch on window focus (optional)
if (typeof window !== 'undefined') {
  let isRefetching = false;
  
  const handleFocus = async () => {
    if (isRefetching) return;
    
    const store = useUserProfileStore.getState();
    
    // Only refetch if we have a profile and it's older than 2 minutes
    if (store.hasValidProfile() && store.getProfileAge() > 2 * 60 * 1000) {
      isRefetching = true;
      console.log('🔄 Auto-refetching profile on window focus...');
      
      try {
        // You'll need to get userId from your auth context
        // This is a simplified example
        const userId = store.profile?.id || store.profile?.userId;
        if (userId) {
          await store.fetchUserProfile(userId, { force: true });
        }
      } catch (error) {
        console.error('Failed to auto-refetch profile:', error);
      } finally {
        isRefetching = false;
      }
    }
  };

  window.addEventListener('focus', handleFocus);
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleFocus();
    }
  });
}

export default useUserProfileStore;