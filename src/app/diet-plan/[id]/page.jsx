// pages/diet-plans/[id]/page.jsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Target,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";

import DietDayCard from "./DietDayCard";
import AddFoodModal from "./AddFoodModal";
import MealCard from "./MealCard";
import dietPlanService from "@/service/dietPlanService";
import useDietPlanStore from "@/stores/useDietPlanStore";
import { useAuth } from "@/hooks/useAuth";

export default function SingleDietPlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const {
    currentPlan: dietPlan,
    loading,
    error,
    fetchDietPlan,
    deleteDietPlan,
    cloneDietPlan,
    addDay,
    clearError,
    clearCurrentPlan,
  } = useDietPlanStore();
  const [activeDay, setActiveDay] = useState(1);

  const loadDietPlan = useCallback(async () => {
    try {
      clearError();
      await fetchDietPlan(id);
    } catch (err) {
      console.error("Error fetching diet plan:", err);
      // Error is handled by the store
    }
  }, [id, fetchDietPlan, clearError]);

  // Fixed useEffect - only run when user is available and not in auth loading state
  useEffect(() => {
    if (!authLoading && user && id) {
      loadDietPlan();
    } else if (!authLoading && !user) {
      clearCurrentPlan();
    }

    // Cleanup when component unmounts or ID changes
    return () => {
      if (!id) {
        clearCurrentPlan();
      }
    };
  }, [authLoading, user, id, loadDietPlan, clearCurrentPlan]);

  const handleDeletePlan = async () => {
    if (!confirm("Are you sure you want to delete this entire diet plan?"))
      return;

    try {
      clearError();
      await deleteDietPlan(id);
      router.push("/diet-plans");
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Failed to delete plan. Please try again.");
    }
  };

  const handleClonePlan = async () => {
    const newName = prompt(
      "Enter a name for the cloned plan:",
      `${dietPlan.name} (Copy)`
    );
    if (!newName) return;

    try {
      clearError();
      const clonedPlan = await cloneDietPlan(id, newName);
      router.push(`/diet-plans/${clonedPlan._id}`);
    } catch (err) {
      console.error("Error cloning plan:", err);
      alert("Failed to clone plan. Please try again.");
    }
  };

  // 7. Replace the handleAddDay function - REPLACE with:
  const handleAddDay = async () => {
    try {
      clearError();
      const newDayNumber = dietPlan.days.length + 1;
      const dayData = {
        dayNumber: newDayNumber,
        meals: [
          { type: "Breakfast", items: [] },
          { type: "Lunch", items: [] },
          { type: "Dinner", items: [] },
          { type: "Snacks", items: [] },
        ],
      };

      await addDay(id, dayData);
    } catch (err) {
      console.error("Error adding day:", err);
      alert("Failed to add day. Please try again.");
    }
  };

  // Show loading while auth is loading OR while fetching diet plan
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-300 dark:bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error Loading Diet Plan
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={loadDietPlan}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/diet-plan")}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Back to Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Diet Plan Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The diet plan you're looking for doesn't exist or has been
              deleted.
            </p>
            <button
              onClick={() => router.push("/diet-plan")}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
            >
              Back to Diet Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  const averageCalories =
    dietPlan.days.length > 0
      ? Math.round(
          dietPlan.days.reduce((sum, day) => sum + day.totalCalories, 0) /
            dietPlan.days.length
        )
      : dietPlan.targetCalories;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-8">
          {/* Top row with back button and title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/diet-plan")}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {dietPlan.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base truncate">
                {dietPlan.description || `${dietPlan.goal} diet plan`}
              </p>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleClonePlan}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Copy className="h-4 w-4" />
              <span>Clone</span>
            </button>
            <button
              onClick={() => router.push(`/diet-plan/${id}/edit`)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeletePlan}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-xl mb-2 sm:mb-3 mx-auto">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {dietPlan.goal}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Goal
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-xl mb-2 sm:mb-3 mx-auto">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {averageCalories}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Avg Calories/Day
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-xl mb-2 sm:mb-3 mx-auto">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {dietPlan.days.length}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Days Planned
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-xl mb-2 sm:mb-3 mx-auto">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {dietPlan.duration}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Duration (Days)
              </p>
            </div>
          </div>

          {/* Macro Targets */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Daily Macro Targets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg mb-2 mx-auto">
                  <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                    P
                  </span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-red-700 dark:text-red-300">
                  {dietPlan.targetProtein}g
                </p>
                <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                  Protein
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg mb-2 mx-auto">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                    C
                  </span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  {dietPlan.targetCarbs}g
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm">
                  Carbs
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2 mx-auto">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                    F
                  </span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {dietPlan.targetFats}g
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                  Fats
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Day Navigation */}
        {dietPlan.days.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Diet Plan Days
              </h3>
              <button
                onClick={handleAddDay}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {dietPlan.days.map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeDay === day.dayNumber
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Day {day.dayNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day Content */}
        {dietPlan.days.length > 0 ? (
          <div>
            {dietPlan.days
              .filter((day) => day.dayNumber === activeDay)
              .map((day) => (
                <DietDayCard
                  key={day.dayNumber}
                  day={day}
                  planId={dietPlan._id}
                  onUpdate={loadDietPlan} // Changed from fetchDietPlan to loadDietPlan
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
              <div className="max-w-sm mx-auto">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No days planned yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add your first day to start building your diet plan
                </p>
                <button
                  onClick={handleAddDay}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Day</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
