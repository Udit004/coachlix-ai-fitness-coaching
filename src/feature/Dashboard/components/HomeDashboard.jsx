"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import StreakCounter from "@/feature/home/StreakCounter";
import { useDashboardOverviewQuery } from "@/feature/Dashboard/hooks/useDashboardOverviewQuery";
import {
  calculateWorkoutStreak,
  getCurrentDayNumber,
  getCurrentWeekDays,
  getTodayDietSummary,
  getTodayWorkoutSummary,
} from "@/feature/Dashboard/utils/dashboardData";
import TodayWorkoutCard from "@/feature/Dashboard/components/home/TodayWorkoutCard";
import ProgressOverviewCard from "@/feature/Dashboard/components/home/ProgressOverviewCard";
import NutritionOverviewCard from "@/feature/Dashboard/components/home/NutritionOverviewCard";
import QuickActionsCard from "@/feature/Dashboard/components/home/QuickActionsCard";

export default function HomeDashboard() {
  const { data: dashboardData } = useDashboardOverviewQuery();
  const workoutPlan = dashboardData?.workoutPlan || null;
  const dietPlan = dashboardData?.dietPlan || null;
  const workoutStats = dashboardData?.workoutStats || null;

  const workoutSummary = getTodayWorkoutSummary(workoutPlan);
  const nutrition = getTodayDietSummary(dietPlan);
  const currentWeekDays = getCurrentWeekDays(workoutPlan);
  const currentDayNumber = getCurrentDayNumber();

  const workoutStreak = workoutStats?.currentStreak ?? calculateWorkoutStreak(workoutPlan);
  const nutritionStreak = dashboardData?.nutritionStreak ?? 0;

  return (
    <section className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-400 bg-clip-text text-transparent">
          Today's Dashboard
        </h2>
        <div className="flex gap-2">
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 border border-gray-300 cursor-pointer">
            <Link href="/ai-chat">
              <Bot className="w-4 h-4 mr-2" />
              Ask AI Coach
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <StreakCounter workoutStreak={workoutStreak} nutritionStreak={nutritionStreak} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TodayWorkoutCard workoutPlan={workoutPlan} workoutSummary={workoutSummary} />

        <ProgressOverviewCard
          workoutStats={workoutStats}
          planStats={workoutPlan?.stats}
          weekDays={currentWeekDays}
          currentDayNumber={currentDayNumber}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <NutritionOverviewCard dietPlan={dietPlan} nutrition={nutrition} />
        <QuickActionsCard workoutPlan={workoutPlan} dietPlan={dietPlan} />
      </div>
    </section>
  );
}
