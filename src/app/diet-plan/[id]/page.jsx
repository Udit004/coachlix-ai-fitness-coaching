// pages/diet-plans/[id]/page.jsx
"use client";
import React, { useEffect } from "react";
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
  AlertCircle,
} from "lucide-react";

import DietDayCard from "./DietDayCard";
import DietPlanActions from "./DietPlanActions";
import useDietPlanStore from "@/stores/useDietPlanStore";
import { useAuth } from "@/hooks/useAuth";
import {
  useDietPlan,
  useDeleteDietPlan,
  useCloneDietPlan,
  useAddDay,
  useNutritionSummary,
} from "@/hooks/useDietPlanQueries";

export default function SingleDietPlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const authResult = useAuth();
  const user = authResult?.user || null;
  const authLoading = authResult?.loading || false;

  // Local state for day visibility
  const [showAllDays, setShowAllDays] = React.useState(false);

  // UI state from Zustand
  const {
    activeDay,
    setActiveDay,
    selectedPlanId,
    setSelectedPlanId,
  } = useDietPlanStore();

  // React Query hooks
  const {
    data: dietPlan,
    isLoading,
    error,
    refetch,
  } = useDietPlan(id);

  const {
    data: nutritionSummary,
    isLoading: nutritionLoading,
  } = useNutritionSummary(id);

  const deletePlanMutation = useDeleteDietPlan();
  const clonePlanMutation = useCloneDietPlan();
  const addDayMutation = useAddDay();

  // Set selected plan ID when component mounts or ID changes
  useEffect(() => {
    router.prefetch(`/diet-plan/`);
    
    if (id && id !== selectedPlanId) {
      setSelectedPlanId(id);
    }

    // Reset active day when switching plans
    if (id !== selectedPlanId) {
      setActiveDay(1);
    }
  }, [id, selectedPlanId, setSelectedPlanId, setActiveDay, router]);

  // Reset active day when diet plan changes (in case the current activeDay doesn't exist)
  useEffect(() => {
    if (dietPlan?.days?.length > 0) {
      const dayExists = dietPlan.days.some(day => day.dayNumber === activeDay);
      if (!dayExists) {
        setActiveDay(1);
      }
    }
  }, [dietPlan, activeDay, setActiveDay]);

  const handleDeletePlan = async () => {
    if (!confirm("Are you sure you want to delete this entire diet plan?"))
      return;

    try {
      await deletePlanMutation.mutateAsync(id);
      router.push("/diet-plans");
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Failed to delete plan. Please try again.");
    }
  };

  const handleClonePlan = async () => {
    if (!dietPlan) return;
    
    const newName = prompt(
      "Enter a name for the cloned plan:",
      `${dietPlan.name} (Copy)`
    );
    if (!newName) return;

    try {
      const clonedPlan = await clonePlanMutation.mutateAsync({ 
        planId: id, 
        newName 
      });
      router.push(`/diet-plans/${clonedPlan._id}`);
    } catch (err) {
      console.error("Error cloning plan:", err);
      alert("Failed to clone plan. Please try again.");
    }
  };

  const handleAddDay = async () => {
    if (!dietPlan) return;
    
    try {
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

      await addDayMutation.mutateAsync({ planId: id, dayData });
      
      // Set the newly created day as active
      setActiveDay(newDayNumber);
    } catch (err) {
      console.error("Error adding day:", err);
      alert("Failed to add day. Please try again.");
    }
  };

  // Show loading while auth is loading OR while fetching diet plan
  if (authLoading || isLoading) {
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

  // Show login prompt if user is not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please log in to access your diet plans
              </p>
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
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error Loading Diet Plan
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">
                {error?.message || "Failed to load diet plan"}
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => refetch()}
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
    dietPlan.days?.length > 0
      ? Math.round(
          dietPlan.days.reduce((sum, day) => sum + (day.totalCalories || 0), 0) /
            dietPlan.days.length
        )
      : dietPlan.targetCalories || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          {/* Top row with back button and title */}
          <div className="flex items-center gap-3">
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
            
            {/* Action buttons - Mobile (right side of header) */}
            <div className="lg:hidden flex-shrink-0">
              <DietPlanActions
                onClone={handleClonePlan}
                onEdit={() => router.push(`/diet-plan/${id}/edit`)}
                onDelete={handleDeletePlan}
                isCloning={clonePlanMutation.isPending}
                isDeleting={deletePlanMutation.isPending}
              />
            </div>
          </div>

          {/* Action buttons - Desktop */}
          <div className="hidden lg:flex flex-shrink-0">
            <DietPlanActions
              onClone={handleClonePlan}
              onEdit={() => router.push(`/diet-plan/${id}/edit`)}
              onDelete={handleDeletePlan}
              isCloning={clonePlanMutation.isPending}
              isDeleting={deletePlanMutation.isPending}
            />
          </div>
        </div>

        {/* Plan Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {/* Goal */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 sm:p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-green-100 dark:bg-green-900 rounded-xl flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center lg:text-left flex-1 min-w-0">
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {dietPlan.goal}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs lg:text-sm mt-0.5">
                    Goal
                  </p>
                </div>
              </div>
            </div>

            {/* Avg Calories */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 sm:p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center lg:text-left flex-1 min-w-0">
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {averageCalories}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs lg:text-sm mt-0.5">
                    Avg Cal/Day
                  </p>
                </div>
              </div>
            </div>

            {/* Days Planned */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 sm:p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-purple-100 dark:bg-purple-900 rounded-xl flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-center lg:text-left flex-1 min-w-0">
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {dietPlan.days?.length || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs lg:text-sm mt-0.5">
                    Days
                  </p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 sm:p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-orange-100 dark:bg-orange-900 rounded-xl flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-center lg:text-left flex-1 min-w-0">
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {dietPlan.duration}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs lg:text-sm mt-0.5">
                    Duration
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Macro Targets */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Daily Macro Targets
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {/* Protein */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-2 sm:p-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900 rounded-lg mb-1.5 sm:mb-2">
                    <span className="text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm">
                      P
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-700 dark:text-red-300">
                    {dietPlan.targetProtein || 0}<span className="text-sm sm:text-base">g</span>
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-0.5">
                    Protein
                  </p>
                </div>
              </div>

              {/* Carbs */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg p-2 sm:p-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg mb-1.5 sm:mb-2">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold text-xs sm:text-sm">
                      C
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {dietPlan.targetCarbs || 0}<span className="text-sm sm:text-base">g</span>
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm mt-0.5">
                    Carbs
                  </p>
                </div>
              </div>

              {/* Fats */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-2 sm:p-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg mb-1.5 sm:mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm">
                      F
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {dietPlan.targetFats || 0}<span className="text-sm sm:text-base">g</span>
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm mt-0.5">
                    Fats
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day Navigation */}
        {dietPlan.days?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Diet Plan Days
              </h3>
              <button
                onClick={handleAddDay}
                disabled={addDayMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{addDayMutation.isPending ? "Adding..." : "Add Day"}</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Mobile View - Show limited days with expand button */}
            <div className="lg:hidden">
              <div className="flex flex-wrap gap-2">
                {dietPlan.days
                  .slice(0, showAllDays ? dietPlan.days.length : 6)
                  .map((day) => (
                    <button
                      key={day.dayNumber}
                      onClick={() => setActiveDay(day.dayNumber)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeDay === day.dayNumber
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Day {day.dayNumber}
                    </button>
                  ))}
              </div>
              
              {dietPlan.days.length > 6 && (
                <button
                  onClick={() => setShowAllDays(!showAllDays)}
                  className="mt-3 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                >
                  {showAllDays ? "Show Less" : `Show All ${dietPlan.days.length} Days`}
                </button>
              )}
            </div>

            {/* Desktop View - Show all or with expand if more than 14 */}
            <div className="hidden lg:block">
              <div className="flex flex-wrap gap-2">
                {dietPlan.days
                  .slice(0, showAllDays || dietPlan.days.length <= 14 ? dietPlan.days.length : 14)
                  .map((day) => (
                    <button
                      key={day.dayNumber}
                      onClick={() => setActiveDay(day.dayNumber)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeDay === day.dayNumber
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Day {day.dayNumber}
                    </button>
                  ))}
              </div>
              
              {dietPlan.days.length > 14 && (
                <button
                  onClick={() => setShowAllDays(!showAllDays)}
                  className="mt-3 px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                >
                  {showAllDays ? "Show Less" : `Show All ${dietPlan.days.length} Days`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Day Content */}
        {dietPlan.days?.length > 0 ? (
          <div>
            {dietPlan.days
              .filter((day) => day.dayNumber === activeDay)
              .map((day) => (
                <DietDayCard
                  key={day.dayNumber}
                  day={day}
                  planId={dietPlan._id}
                  onUpdate={() => refetch()} // Use refetch from React Query
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
                  disabled={addDayMutation.isPending}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>{addDayMutation.isPending ? "Adding..." : "Add First Day"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}