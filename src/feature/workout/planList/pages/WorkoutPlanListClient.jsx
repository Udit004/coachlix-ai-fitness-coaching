"use client";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  useWorkoutPlans,
  useCreateWorkoutPlan,
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  useCloneWorkoutPlan,
  useToggleWorkoutPlanActive,
} from "../hooks/useWorkoutPlanListQueries";
import PageSkeleton from "../components/PageSkeleton";
import WorkoutPlanHeader from "../components/WorkoutPlanHeader";
import WorkoutPlanStats from "../components/WorkoutPlanStats";
import WorkoutPlanFilters from "../components/WorkoutPlanFilters";
import WorkoutPlanGrid from "../components/WorkoutPlanGrid";
import DeleteModal from "../../components/DeleteModal";

const ModalSkeleton = ({ maxWidth = "max-w-xl" }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div className={`w-[90%] ${maxWidth} bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg`}>
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-6"></div>
      </div>
    </div>
  </div>
);

const CreatePlanModal = dynamic(() => import("../components/CreatePlanModal"), {
  loading: () => <ModalSkeleton maxWidth="max-w-xl" />,
  ssr: false,
});

const EditPlanModal = dynamic(() => import("../components/EditPlanModal"), {
  loading: () => <ModalSkeleton maxWidth="max-w-2xl" />,
  ssr: false,
});

/**
 * WorkoutPlanListClient — orchestrates state, data fetching, and handlers.
 *
 * The parent Server Component (page.jsx) uses HydrationBoundary + dehydrate
 * to pre-populate the TanStack Query cache before this component renders,
 * so the first paint is instant with real data and no extra round-trip.
 */
export default function WorkoutPlanListClient() {
  const { user, loading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null);

  // ── Query options ─────────────────────────────────────────────────────────
  const queryOptions = useMemo(
    () => ({
      ...(selectedGoal && { goal: selectedGoal }),
      ...(selectedDifficulty && { difficulty: selectedDifficulty }),
      sort:
        sortBy === "newest" ? "-createdAt"
        : sortBy === "oldest" ? "createdAt"
        : sortBy === "updated" ? "-updatedAt"
        : sortBy === "popular" ? "popular"
        : "-createdAt",
    }),
    [selectedGoal, selectedDifficulty, sortBy]
  );

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: workoutPlansData, isLoading: loading, error: fetchError, refetch } =
    useWorkoutPlans(queryOptions);

  const createPlanMutation = useCreateWorkoutPlan();
  const updatePlanMutation = useUpdateWorkoutPlan();
  const deletePlanMutation = useDeleteWorkoutPlan();
  const clonePlanMutation = useCloneWorkoutPlan();
  const toggleActiveMutation = useToggleWorkoutPlanActive();

  // ── Derived data ──────────────────────────────────────────────────────────
  const workoutPlans = useMemo(() => {
    if (!workoutPlansData) return [];
    return Array.isArray(workoutPlansData.plans)
      ? workoutPlansData.plans
      : Array.isArray(workoutPlansData)
      ? workoutPlansData
      : [];
  }, [workoutPlansData]);

  const filteredPlans = useMemo(() => {
    if (!Array.isArray(workoutPlans)) return [];
    if (!searchTerm) return workoutPlans;
    const lower = searchTerm.toLowerCase();
    return workoutPlans.filter((plan) => {
      if (!plan) return false;
      return (
        plan.name?.toLowerCase().includes(lower) ||
        plan.description?.toLowerCase().includes(lower) ||
        plan.goal?.toLowerCase().includes(lower) ||
        plan.targetMuscleGroups?.some((g) => g.toLowerCase().includes(lower))
      );
    });
  }, [workoutPlans, searchTerm]);

  const stats = useMemo(() => {
    if (!Array.isArray(workoutPlans) || workoutPlans.length === 0)
      return { totalPlans: 0, activePlans: 0, averageDuration: 0, totalWorkouts: 0 };
    return {
      totalPlans: workoutPlans.length,
      activePlans: workoutPlans.filter((p) => p?.isActive).length,
      averageDuration: Math.round(
        workoutPlans.reduce((sum, p) => sum + (p?.duration || 0), 0) / workoutPlans.length
      ),
      totalWorkouts: workoutPlans.reduce((sum, p) => sum + (p?.stats?.totalWorkouts || 0), 0),
    };
  }, [workoutPlans]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreatePlan = async (planData) => {
    try {
      if (!planData || !planData.name?.trim()) throw new Error("Plan name is required");
      await createPlanMutation.mutateAsync(planData);
      setShowCreateModal(false);
      success(`Workout plan "${planData.name}" created successfully!`);
    } catch (err) {
      console.error("Error creating plan:", err);
      toastError(err.message || "Failed to create workout plan");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleUpdatePlan = async (planId, updateData) => {
    try {
      await updatePlanMutation.mutateAsync({ planId, updateData });
      setShowEditModal(false);
      setEditingPlan(null);
      success(`Workout plan "${updateData.name}" updated successfully!`);
    } catch (err) {
      console.error("Error updating plan:", err);
      toastError(err.message || "Failed to update workout plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!planId) return;
    try {
      await deletePlanMutation.mutateAsync(planId);
      success("Workout plan deleted successfully!");
    } catch (err) {
      console.error("Error deleting plan:", err);
      toastError(err.message || "Failed to delete workout plan");
    } finally {
      setShowDeleteModal(false);
      setDeletingPlan(null);
    }
  };

  const handleDeleteClick = (plan) => {
    if (!plan?._id) return;
    setDeletingPlan(plan);
    setShowDeleteModal(true);
  };

  const handleClonePlan = async (planId, newName) => {
    if (!planId || !newName?.trim()) return;
    try {
      await clonePlanMutation.mutateAsync({ planId, newName });
      success(`Plan cloned as "${newName}"!`);
    } catch (err) {
      console.error("Error cloning plan:", err);
      toastError(err.message || "Failed to clone workout plan");
    }
  };

  const handleToggleActive = async (planId, isActive) => {
    if (!planId) return;
    try {
      await toggleActiveMutation.mutateAsync({ planId, isActive });
      success(isActive ? "Workout plan activated!" : "Workout plan deactivated!");
    } catch (err) {
      console.error("Error toggling plan active status:", err);
      toastError("Failed to update plan status. Please try again.");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedGoal("");
    setSelectedDifficulty("");
    setSortBy("newest");
  };

  // ── Early returns ─────────────────────────────────────────────────────────
  if (authLoading || (loading && filteredPlans.length === 0)) return <PageSkeleton />;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="max-w-sm mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access your workout plans
            </p>
          </div>
        </div>
      </div>
    );
  }

  const error =
    fetchError?.message ||
    createPlanMutation.error?.message ||
    updatePlanMutation.error?.message ||
    deletePlanMutation.error?.message ||
    clonePlanMutation.error?.message;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <WorkoutPlanHeader
          onCreate={() => setShowCreateModal(true)}
          isCreating={createPlanMutation.isPending}
        />

        <WorkoutPlanStats stats={stats} />

        <WorkoutPlanFilters
          searchTerm={searchTerm}
          selectedGoal={selectedGoal}
          selectedDifficulty={selectedDifficulty}
          sortBy={sortBy}
          onSearchChange={setSearchTerm}
          onGoalChange={setSelectedGoal}
          onDifficultyChange={setSelectedDifficulty}
          onSortChange={setSortBy}
          onClear={handleClearFilters}
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">Error: {error}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        <WorkoutPlanGrid
          plans={filteredPlans}
          searchTerm={searchTerm}
          selectedGoal={selectedGoal}
          selectedDifficulty={selectedDifficulty}
          onDelete={handleDeleteClick}
          onClone={handleClonePlan}
          onEdit={handleEditPlan}
          onToggleActive={handleToggleActive}
          isDeleting={deletePlanMutation.isPending}
          isCloning={clonePlanMutation.isPending}
          onCreateFirst={() => setShowCreateModal(true)}
        />

        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePlan}
            isLoading={createPlanMutation.isPending}
          />
        )}

        {showEditModal && editingPlan && (
          <EditPlanModal
            plan={editingPlan}
            onClose={() => {
              setShowEditModal(false);
              setEditingPlan(null);
            }}
            onUpdate={handleUpdatePlan}
            isLoading={updatePlanMutation.isPending}
          />
        )}

        {deletingPlan && (
          <DeleteModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeletingPlan(null);
            }}
            onConfirm={() => handleDeletePlan(deletingPlan._id)}
            title="Delete Workout Plan"
            description="Are you sure you want to delete this workout plan? This action cannot be undone."
            itemName={deletingPlan.name}
            isLoading={deletePlanMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
