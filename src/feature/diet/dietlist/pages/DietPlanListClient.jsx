"use client";
import React, { useState, useMemo, useCallback } from "react";
import useDietPlanStore from "../store/useDietPlanStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  useDietPlans,
  useCreateDietPlan,
  useUpdateDietPlan,
  useDeleteDietPlan,
  useCloneDietPlan,
  useToggleDietPlanActive,
} from "../hooks/useDietPlanListQueries";

// Components
import DietPlanHeader from "../components/DietPlanHeader";
import DietPlanStats from "../components/DietPlanStats";
import DietPlanFilters from "../components/DietPlanFilters";
import DietPlansGrid from "../components/DietPlansGrid";
import DietPlanModals from "../components/DietPlanModals";
import {
  ErrorState,
  AuthErrorState,
  NotAuthenticatedState,
  LoadingSkeleton,
} from "../components/DietPlanStates";

/**
 * DietPlanListClient — Client component that orchestrates UI state and data fetching
 * for the diet plan list feature.
 *
 * Responsibilities:
 * - Manage authentication state
 * - Handle data fetching through TanStack Query
 * - Manage UI state (filters, modals, selections)
 * - Coordinate callbacks and event handlers
 * - Render child components with appropriate props
 *
 * The parent Server Component (page.jsx) uses HydrationBoundary + dehydrate
 * to pre-populate the TanStack Query cache before this component renders.
 */
export default function DietPlanListClient() {
  // ── Toast notifications ──────────────────────────────────────────────────
  const { success, error: toastError } = useToast();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { loading: authLoading, error: authError, isAuthenticated } = useAuth();

  // ── Zustand UI state ──────────────────────────────────────────────────────
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

  // ── Local UI state ────────────────────────────────────────────────────────
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Query options derived from UI state ───────────────────────────────────
  const queryOptions = useMemo(
    () => ({
      ...(selectedGoal && { goal: selectedGoal }),
      sort:
        sortBy === "newest"
          ? "-createdAt"
          : sortBy === "oldest"
            ? "createdAt"
            : "-updatedAt",
    }),
    [selectedGoal, sortBy],
  );

  // ── Server state ──────────────────────────────────────────────────────────
  const {
    data: dietPlans = [],
    isLoading,
    error,
    refetch,
  } = useDietPlans(queryOptions);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createPlanMutation = useCreateDietPlan();
  const updatePlanMutation = useUpdateDietPlan();
  const deletePlanMutation = useDeleteDietPlan();
  const clonePlanMutation = useCloneDietPlan();
  const toggleActiveMutation = useToggleDietPlanActive();

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredPlans = useMemo(() => {
    if (!Array.isArray(dietPlans)) return [];
    return dietPlans.filter((plan) => {
      if (!plan) return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        plan.name?.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower) ||
        plan.goal?.toLowerCase().includes(searchLower)
      );
    });
  }, [dietPlans, searchTerm]);

  const activeCount = useMemo(
    () =>
      Array.isArray(dietPlans)
        ? dietPlans.filter((p) => p?.isActive).length
        : 0,
    [dietPlans],
  );

  const averageCalories = useMemo(() => {
    if (!Array.isArray(dietPlans) || dietPlans.length === 0) return 0;
    const total = dietPlans.reduce(
      (sum, p) => sum + (p?.targetCalories || 0),
      0,
    );
    return Math.round(total / dietPlans.length);
  }, [dietPlans]);

  const hasActiveFilters = !!(
    searchTerm ||
    selectedGoal ||
    sortBy !== "newest"
  );

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleCreatePlan = useCallback(
    async (planData) => {
      try {
        if (!planData?.name?.trim()) throw new Error("Plan name is required");
        await createPlanMutation.mutateAsync(planData);
        setShowCreateModal(false);
        success(`Diet plan "${planData.name}" created successfully!`);
        if (selectedGoal && selectedGoal !== planData.goal) setSelectedGoal("");
      } catch (err) {
        console.error("Error creating plan:", err);
        toastError(err.message || "Failed to create diet plan");
      }
    },
    [
      createPlanMutation,
      setShowCreateModal,
      selectedGoal,
      setSelectedGoal,
      success,
      toastError,
    ],
  );

  const handleDeletePlan = useCallback(
    async (planId) => {
      if (!planId) return;
      try {
        await deletePlanMutation.mutateAsync(planId);
        success("Diet plan deleted successfully!");
      } catch (err) {
        console.error("Error deleting plan:", err);
        toastError(err.message || "Failed to delete diet plan");
      } finally {
        setShowDeleteModal(false);
        setDeletingPlanId(null);
      }
    },
    [deletePlanMutation, success, toastError],
  );

  const handleClonePlan = useCallback(
    async (planId, newName) => {
      if (!planId || !newName?.trim()) return;
      try {
        await clonePlanMutation.mutateAsync({ planId, newName });
        success(`Plan cloned as "${newName}"!`);
      } catch (err) {
        console.error("Error cloning plan:", err);
        toastError(err.message || "Failed to clone diet plan");
      }
    },
    [clonePlanMutation, success, toastError],
  );

  const handleEditSave = useCallback(
    async (planId, updateData) => {
      try {
        await updatePlanMutation.mutateAsync({ planId, updateData });
        success(`Diet plan "${updateData.name}" updated successfully!`);
        setEditingPlan(null);
        await refetch();
      } catch (err) {
        console.error("Error updating plan:", err);
        toastError(err.message || "Failed to update diet plan");
      }
    },
    [updatePlanMutation, success, toastError, refetch],
  );

  const handleToggleActive = useCallback(
    async (planId, isActive) => {
      if (!planId) return;
      try {
        await toggleActiveMutation.mutateAsync({ planId, isActive });
        success(isActive ? "Diet plan activated!" : "Diet plan deactivated!");
      } catch (err) {
        console.error("Error toggling plan active status:", err);
        toastError("Failed to update plan status. Please try again.");
      }
    },
    [toggleActiveMutation, success, toastError],
  );

  // ── Auth error ────────────────────────────────────────────────────────────
  if (authError) {
    return (
      <AuthErrorState
        error={authError}
        onReload={() => window.location.reload()}
      />
    );
  }

  // ── Auth loading skeleton ─────────────────────────────────────────────────
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <NotAuthenticatedState />;
  }

  // ── Fetching skeleton (only when no SSR data and no cache yet) ────────────
  if (isLoading && filteredPlans.length === 0) {
    return <LoadingSkeleton />;
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <DietPlanHeader
          onCreateClick={() => setShowCreateModal(true)}
          isCreating={createPlanMutation.isPending}
        />

        {/* Stats Cards */}
        <DietPlanStats
          totalPlans={Array.isArray(dietPlans) ? dietPlans.length : 0}
          activeCount={activeCount}
          averageCalories={averageCalories}
        />

        {/* Filters and Search */}
        <DietPlanFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGoal={selectedGoal}
          onGoalChange={setSelectedGoal}
          sortBy={sortBy}
          onSortChange={setSortBy}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={resetFilters}
        />

        {/* Error State */}
        {error && <ErrorState error={error} onRetry={() => refetch()} />}

        {/* Diet Plans Grid */}
        <DietPlansGrid
          plans={filteredPlans}
          onDelete={(planId) => {
            setDeletingPlanId(planId);
            setShowDeleteModal(true);
          }}
          onClone={handleClonePlan}
          onEdit={setEditingPlan}
          onToggleActive={handleToggleActive}
          isDeleting={deletePlanMutation.isPending}
          isCloning={clonePlanMutation.isPending}
          hasAnyFilters={hasActiveFilters}
          onCreateClick={() => setShowCreateModal(true)}
        />

        {/* Modals */}
        <DietPlanModals
          showCreateModal={showCreateModal}
          onCreateModalClose={() => setShowCreateModal(false)}
          onCreatePlan={handleCreatePlan}
          isCreating={createPlanMutation.isPending}
          editingPlan={editingPlan}
          onEditModalClose={() => setEditingPlan(null)}
          onEditSave={handleEditSave}
          isUpdating={updatePlanMutation.isPending}
          showDeleteModal={showDeleteModal}
          deletingPlanId={deletingPlanId}
          deletingPlanName={
            Array.isArray(dietPlans) 
              ? dietPlans.find((p) => p._id === deletingPlanId)?.name
              : undefined
          }
          onDeleteModalClose={() => {
            setShowDeleteModal(false);
            setDeletingPlanId(null);
          }}
          onDeleteConfirm={() => handleDeletePlan(deletingPlanId)}
          isDeleting={deletePlanMutation.isPending}
        />
      </div>
    </div>
  );
}
