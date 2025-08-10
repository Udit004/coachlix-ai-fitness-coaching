// hooks/useFoodQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dietPlanService from '../service/dietPlanService';
import { useAuth } from './useAuth';

// Query Keys for Foods
export const FOOD_KEYS = {
  all: ['foods'],
  search: (query) => [...FOOD_KEYS.all, 'search', query],
  popular: (category) => [...FOOD_KEYS.all, 'popular', category],
  details: (foodName) => [...FOOD_KEYS.all, 'details', foodName],
};

// Hook to search foods
export const useSearchFoods = (query, options = {}) => {
  const { user } = useAuth();
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: FOOD_KEYS.search(query),
    queryFn: () => dietPlanService.searchFoods(query),
    enabled: !!user && !!query && query.length >= 2 && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - food data doesn't change often
    placeholderData: [], // Show empty array while loading
  });
};

// Hook to get popular foods
export const usePopularFoods = (category = null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: FOOD_KEYS.popular(category),
    queryFn: () => dietPlanService.getPopularFoods(category),
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes - popular foods change rarely
  });
};

// Hook to get AI food details
export const useFoodDetailsWithAI = (foodName, options = {}) => {
  const { user } = useAuth();
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: FOOD_KEYS.details(foodName),
    queryFn: () => dietPlanService.getFoodDetailsWithAI(foodName),
    enabled: !!user && !!foodName && enabled,
    staleTime: 60 * 60 * 1000, // 1 hour - food nutritional data is fairly stable
    retry: 2, // Retry fewer times for AI calls as they might be rate limited
  });
};

// Custom hook for debounced food search
export const useDebouncedFoodSearch = (query, delay = 300) => {
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  return useSearchFoods(debouncedQuery, {
    enabled: debouncedQuery.length >= 2
  });
};

// Export individual functions for backwards compatibility
export {
  useSearchFoods as searchFoods,
  usePopularFoods as getPopularFoods,
  useFoodDetailsWithAI as getFoodDetailsWithAI,
};