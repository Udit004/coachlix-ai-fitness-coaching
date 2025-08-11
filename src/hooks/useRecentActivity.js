// hooks/useRecentActivity.js
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useChatHistoryStore from '../stores/useChatHistoryStore';
import { useWorkoutPlans } from './useWorkoutQueries';
import { useDietPlans } from './useDietPlanQueries';

export const useRecentActivity = (userId) => {
  const [refreshing, setRefreshing] = useState(false);

  // Chats
  const { chats, loading: chatsLoading, fetchChats } = useChatHistoryStore();

  // Workout plans
  const { data: workoutPlansRaw, isLoading: workoutsLoading, refetch: refetchWorkouts } = useWorkoutPlans();
  const workoutPlans = Array.isArray(workoutPlansRaw) ? workoutPlansRaw : [];

  // Diet plans
  const { data: dietPlansRaw, isLoading: dietsLoading, refetch: refetchDiets } = useDietPlans();
  const dietPlans = Array.isArray(dietPlansRaw) ? dietPlansRaw : [];

  // Progress stats
  const { data: progressData } = useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async () => {
      const res = await fetch(`/api/user-progress?userId=${userId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Sort and pick recent workout plans (by last updated or last workout)
  const activeWorkouts = useMemo(() => {
    if (workoutPlans.length === 0) return [];

    return [...workoutPlans]
      .sort((a, b) => {
        const dateA = new Date(a.lastWorkoutDate || a.updatedAt || 0).getTime();
        const dateB = new Date(b.lastWorkoutDate || b.updatedAt || 0).getTime();
        return dateB - dateA; // most recent first
      })
      .slice(0, 2)
      .map(plan => {
        const weeks = Array.isArray(plan.weeks) ? plan.weeks : [];
        const totalWeeks = weeks.length;
        const totalDays = totalWeeks * 7;

        let completedDays = 0;
        let currentWeek = 1;
        let currentDay = 1;
        let nextWorkout = 'Start Workout';

        outerLoop:
        for (let w = 0; w < weeks.length; w++) {
          const days = Array.isArray(weeks[w].days) ? weeks[w].days : [];
          for (let d = 0; d < days.length; d++) {
            if (days[d].isCompleted) {
              completedDays++;
            } else {
              currentWeek = w + 1;
              currentDay = d + 1;
              nextWorkout = days[d].workouts?.[0]?.name || 'Workout';
              break outerLoop;
            }
          }
        }

        const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        return {
          _id: plan._id,
          name: plan.name,
          currentWeek,
          currentDay,
          progress,
          lastWorkout: plan.lastWorkoutDate ? new Date(plan.lastWorkoutDate) : null,
          nextWorkout,
          exerciseCount: weeks[currentWeek - 1]?.days?.[currentDay - 1]?.workouts?.[0]?.exercises?.length || 0
        };
      });
  }, [workoutPlans]);

  // Recent chats
  const recentChats = useMemo(() => {
    if (!Array.isArray(chats) || chats.length === 0) return [];

    return chats
      .filter(chat => !chat.isArchived)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3)
      .map(chat => ({
        _id: chat._id,
        title: chat.title,
        lastMessage: chat.lastMessage ||
          (chat.messages?.length > 0
            ? chat.messages[chat.messages.length - 1].content.substring(0, 100)
            : 'No messages yet'),
        updatedAt: chat.updatedAt,
        plan: chat.plan || 'general',
        messageCount: chat.messageCount || chat.messages?.length || 0
      }));
  }, [chats]);

  // Diet plans
  const activeDietPlans = useMemo(() => {
    if (dietPlans.length === 0) return [];

    return dietPlans
      .filter(plan => plan.status === 'active' || !plan.status)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 1)
      .map(plan => {
        const today = new Date().toDateString();
        const todayData = plan.days?.find(day => new Date(day.date).toDateString() === today);

        const todayCalories = todayData?.meals?.reduce((total, meal) =>
          total + (meal.foods?.reduce((mealTotal, food) => mealTotal + (food.calories || 0), 0) || 0), 0
        ) || 0;

        const completedMeals = todayData?.meals?.filter(meal => meal.isCompleted)?.length || 0;
        const totalMeals = todayData?.meals?.length || 5;

        return {
          _id: plan._id,
          name: plan.name,
          goal: plan.goal || 'general',
          currentDay: plan.currentDay || 1,
          totalDays: plan.days?.length || 7,
          todayCalories,
          targetCalories: plan.dailyCalorieTarget || 2000,
          completedMeals,
          totalMeals
        };
      });
  }, [dietPlans]);

  // Progress summary
  const progress = useMemo(() => {
    if (!progressData) {
      const weeklyWorkouts = activeWorkouts.reduce((count, workout) => count + Math.floor(workout.progress / 20), 0);
      return {
        weeklyWorkouts,
        weeklyTarget: 5,
        currentStreak: Math.max(...activeWorkouts.map(w => Math.floor(w.progress / 10))) || 0
      };
    }
    return {
      weeklyWorkouts: progressData.weeklyWorkouts || 0,
      weeklyTarget: progressData.weeklyTarget || 5,
      currentStreak: progressData.currentStreak || 0
    };
  }, [progressData, activeWorkouts]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        userId ? fetchChats(userId, { force: true }) : Promise.resolve(),
        refetchWorkouts(),
        refetchDiets()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId && chats.length === 0 && !chatsLoading) {
      fetchChats(userId);
    }
  }, [userId, chats.length, chatsLoading, fetchChats]);

  const loading = chatsLoading || workoutsLoading || dietsLoading;

  return {
    recentChats,
    activeWorkouts,
    dietPlans: activeDietPlans,
    progress,
    loading,
    refreshing,
    handleRefresh,
    hasActivity: recentChats.length > 0 || activeWorkouts.length > 0 || activeDietPlans.length > 0,
    stats: {
      totalChats: chats?.length || 0,
      activeWorkoutPlans: activeWorkouts.length,
      activeDietPlans: activeDietPlans.length,
      averageProgress: activeWorkouts.length > 0
        ? Math.round(activeWorkouts.reduce((sum, w) => sum + w.progress, 0) / activeWorkouts.length)
        : 0
    }
  };
};

export default useRecentActivity;
