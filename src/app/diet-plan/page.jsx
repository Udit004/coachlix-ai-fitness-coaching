"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import DietPlanCard from "./DietPlanCard";
import useDietPlanStore from "../../stores/useDietPlanStore";
import { useAuth } from "../../hooks/useAuth";
import { 
  useDietPlans, 
  useCreateDietPlan, 
  useDeleteDietPlan, 
  useCloneDietPlan 
} from "../../hooks/useDietPlanQueries";

export default function DietPlansPage() {
  const { user, loading: authLoading } = useAuth();
  
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

  const goals = [
    "Weight Loss",
    "Muscle Gain",
    "Maintenance",
    "Cutting",
    "Bulking",
    "General Health",
  ];

  // Prepare query options
  const queryOptions = useMemo(() => ({
    activeOnly: true,
    ...(selectedGoal && { goal: selectedGoal }),
    sort:
      sortBy === "newest"
        ? "-createdAt"
        : sortBy === "oldest"
        ? "createdAt"
        : "-updatedAt",
  }), [selectedGoal, sortBy]);

  // React Query hooks
  const {
    data: dietPlans = [],
    isLoading,
    error,
    refetch,
  } = useDietPlans(queryOptions);

  const createPlanMutation = useCreateDietPlan();
  const deletePlanMutation = useDeleteDietPlan();
  const clonePlanMutation = useCloneDietPlan();

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

  const handleCreatePlan = async (planData) => {
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
  };

  const handleDeletePlan = async (planId) => {
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
  };

  const handleClonePlan = async (planId, newName) => {
    if (!planId || !newName?.trim()) {
      console.error("Plan ID and name are required for cloning");
      return;
    }

    try {
      await clonePlanMutation.mutateAsync({ planId, newName });
    } catch (err) {
      console.error("Error cloning plan:", err);
    }
  };

  const calculateAverageCalories = () => {
    if (!Array.isArray(dietPlans) || dietPlans.length === 0) return 0;

    const total = dietPlans.reduce((sum, plan) => {
      return sum + (plan?.targetCalories || 0);
    }, 0);

    return Math.round(total / dietPlans.length);
  };

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
  }

  // Show login prompt if user is not authenticated
  if (!user) {
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
                  isDeleting={deletePlanMutation.isPending}
                  isCloning={clonePlanMutation.isPending}
                />
              );
            })}
          </div>
        );

        {/* Create Plan Modal */}
        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePlan}
            isCreating={createPlanMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

