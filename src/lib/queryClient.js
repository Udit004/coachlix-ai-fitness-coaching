// lib/queryClient.js - React Query client setup
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors (auth issues)
        if (error?.message?.includes('not authenticated') || 
            error?.status === 401 || 
            error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Global defaults for mutations
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
        // You can add global error handling here
        // For example, show a toast notification
      },
    },
  },
});

export default queryClient;