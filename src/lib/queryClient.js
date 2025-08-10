// lib/queryClient.js - Enhanced React Query client setup
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors (auth issues)
        if (error?.message?.includes('not authenticated') || 
            error?.status === 401 || 
            error?.status === 403) {
          return false;
        }
        // Don't retry on 404 errors
        if (error?.status === 404) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // Network mode options
      networkMode: 'online',
    },
    mutations: {
      // Global defaults for mutations
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error?.message?.includes('not authenticated') || 
            error?.status === 401 || 
            error?.status === 403) {
          return false;
        }
        // Don't retry validation errors (400)
        if (error?.status === 400) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
      onError: (error) => {
        console.error('Mutation error:', error);
        // You can add global error handling here
        // For example, show a toast notification or redirect on auth errors
        if (error?.status === 401) {
          // Handle authentication errors globally
          console.log('Authentication error - user may need to log in again');
        }
      },
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Helper function to prefetch diet plan data
export const prefetchDietPlan = (planId) => {
  return queryClient.prefetchQuery({
    queryKey: ['dietPlans', 'detail', planId],
    queryFn: () => dietPlanService.getDietPlan(planId),
    staleTime: 3 * 60 * 1000,
  });
};

// Helper function to invalidate all diet plan related queries
export const invalidateAllDietPlans = () => {
  return queryClient.invalidateQueries({
    queryKey: ['dietPlans'],
  });
};

// Helper function to clear all diet plan cache
export const clearDietPlanCache = () => {
  queryClient.removeQueries({
    queryKey: ['dietPlans'],
  });
};

export default queryClient;