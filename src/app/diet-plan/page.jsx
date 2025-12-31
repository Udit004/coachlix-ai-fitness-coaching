"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import DietPlanCard from "./DietPlanCard";
import useDietPlanStore from "../../stores/useDietPlanStore";
import { useAuth } from "../../hooks/useAuth";
import { 
  useDietPlans, 
  useCreateDietPlan, 
  useUpdateDietPlan,
  useDeleteDietPlan, 
  useCloneDietPlan,
  useToggleDietPlanActive
} from "../../hooks/useDietPlanQueries";

export default function DietPlansPage() {
  // Destructure auth with fallbacks
  const { user, loading: authLoading, error: authError, isAuthenticated } = useAuth();
  
  // UI state from Zustand
  const {
    searchTerm,
    selectedGoal,
    sortBy,
    showCreateModal,
    setSearchTerm,
    setSelectedGoal,
    setSortBy,
    setShowCreateModal,
    resetFilters,
  } = useDietPlanStore();

  const CreatePlanModal = dynamic(() => import("./CreatePlanModal"), {
    loading: () => (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="w-[90%] max-w-xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-6"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  });

  const EditPlanModal = dynamic(() => import("./EditPlanModal"), {
    loading: () => (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="w-[90%] max-w-xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-6"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  });

  const goals = useMemo(() => [
    "Weight Loss",
    "Muscle Gain",
    "Maintenance",
    "Cutting",
    "Bulking",
    "General Health",
  ], []);

  // Prepare query options
  const queryOptions = useMemo(() => ({
    ...(selectedGoal && { goal: selectedGoal }),
    sort:
      sortBy === "newest"
        ? "-createdAt"
        : sortBy === "oldest"
        ? "createdAt"
        : "-updatedAt",
  }), [selectedGoal, sortBy]);

  // React Query hooks - only run when user is authenticated
  const {
    data: dietPlans = [],
    isLoading,
    error,
    refetch,
  } = useDietPlans(queryOptions);

  const createPlanMutation = useCreateDietPlan();
  const updatePlanMutation = useUpdateDietPlan();
  const deletePlanMutation = useDeleteDietPlan();
  const clonePlanMutation = useCloneDietPlan();
  const toggleActiveMutation = useToggleDietPlanActive();

  const [editingPlan, setEditingPlan] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Show auth error if there's an authentication issue
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                Authentication Error
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-6">
                {authError.message || "Failed to authenticate"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter plans based on search term
  const filteredPlans = useMemo(() => {
    if (!Array.isArray(dietPlans)) return [];

    return dietPlans.filter((plan) => {
      if (!plan) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (plan.name && plan.name.toLowerCase().includes(searchLower)) ||
        (plan.description &&
          plan.description.toLowerCase().includes(searchLower)) ||
        (plan.goal && plan.goal.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
  }, [dietPlans, searchTerm]);

  const handleCreatePlan = useCallback(async (planData) => {
    try {
      if (!planData || !planData.name?.trim()) {
        throw new Error("Plan name is required");
      }

      await createPlanMutation.mutateAsync(planData);
      setShowCreateModal(false);

      // Clear filters if they might hide the new plan
      if (selectedGoal && selectedGoal !== planData.goal) {
        setSelectedGoal("");
      }
    } catch (err) {
      console.error("Error creating plan:", err);
    }
  }, [createPlanMutation, setShowCreateModal, selectedGoal, setSelectedGoal]);

  const handleDeletePlan = useCallback(async (planId) => {
    if (!planId) {
      console.error("No plan ID provided for deletion");
      return;
    }

    if (!confirm("Are you sure you want to delete this diet plan?")) return;

    try {
      await deletePlanMutation.mutateAsync(planId);
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
  }, [deletePlanMutation]);

  const handleClonePlan = useCallback(async (planId, newName) => {
    if (!planId || !newName?.trim()) {
      console.error("Plan ID and name are required for cloning");
      return;
    }

    try {
      await clonePlanMutation.mutateAsync({ planId, newName });
    } catch (err) {
      console.error("Error cloning plan:", err);
    }
  }, [clonePlanMutation]);

  const handleEditOpen = useCallback((plan) => {
    setEditingPlan(plan);
  }, []);

  const handleEditSave = useCallback(async (planId, updateData) => {
    await updatePlanMutation.mutateAsync({ planId, updateData });
  }, [updatePlanMutation]);

  const handleToggleActive = useCallback(async (planId, isActive) => {
    if (!planId) {
      console.error("Plan ID is required for toggling active status");
      return;
    }

    try {
      await toggleActiveMutation.mutateAsync({ planId, isActive });
    } catch (err) {
      console.error("Error toggling plan active status:", err);
      alert("Failed to update plan status. Please try again.");
    }
  }, [toggleActiveMutation]);

  const calculateAverageCalories = useCallback(() => {
    if (!Array.isArray(dietPlans) || dietPlans.length === 0) return 0;

    const total = dietPlans.reduce((sum, plan) => {
      return sum + (plan?.targetCalories || 0);
    }, 0);

    return Math.round(total / dietPlans.length);
  }, [dietPlans]);

  const activeCount = useMemo(() => {
    return Array.isArray(dietPlans)
      ? dietPlans.filter((p) => p?.isActive).length
      : 0;
  }, [dietPlans]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                >
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
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

  // Show loading while fetching plans
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                >
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Diet Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your nutrition plans and track your goals
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={createPlanMutation.isPending}
            className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>{createPlanMutation.isPending ? "Creating..." : "Create Plan"}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm sm:p-4">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">
                  Total Plans
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                  {Array.isArray(dietPlans) ? dietPlans.length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm sm:p-4">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
                <Target className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">
                  Active Plans
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm sm:p-4">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">
                  Avg Calories
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                  {calculateAverageCalories().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
          {/* Mobile Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden w-full flex items-center justify-between p-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filters & Search</span>
              {(searchTerm || selectedGoal || sortBy !== "newest") && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-green-600 rounded-full">
                  {[searchTerm, selectedGoal, sortBy !== "newest"].filter(Boolean).length}
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>

          {/* Filters Content */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block p-6`}>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Goal Filter */}
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Goals</option>
                {goals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="updated">Recently Updated</option>
              </select>

              {/* Clear Filters */}
              {(searchTerm || selectedGoal || sortBy !== "newest") && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">
                Error: {error?.message || "Failed to load diet plans"}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Diet Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No diet plans found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedGoal
                  ? "Try adjusting your search or filters"
                  : "Create your first diet plan to get started"}
              </p>
              {!searchTerm && !selectedGoal && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Plan</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              if (!plan || !plan._id) {
                console.warn("Invalid plan data:", plan);
                return null;
              }

              return (
                <DietPlanCard
                  key={plan._id}
                  plan={plan}
                  onDelete={handleDeletePlan}
                  onClone={handleClonePlan}
                  onEdit={handleEditOpen}
                  onToggleActive={handleToggleActive}
                  isDeleting={deletePlanMutation.isPending}
                  isCloning={clonePlanMutation.isPending}
                />
              );
            })}
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePlan}
            isCreating={createPlanMutation.isPending}
          />
        )}

        {/* Edit Plan Modal */}
        {editingPlan && (
          <EditPlanModal
            plan={editingPlan}
            onClose={() => setEditingPlan(null)}
            onSave={handleEditSave}
          />
        )}
      </div>
    </div>
  );
}