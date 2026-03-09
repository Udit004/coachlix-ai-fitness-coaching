"use client";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Filter,
  Search,
  Dumbbell,
  Target,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import WorkoutPlanCard from "./WorkoutPlanCard";
import { useAuth } from "../../hooks/useAuth";
import {
  useWorkoutPlans,
  useCreateWorkoutPlan,
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  useCloneWorkoutPlan,
  useToggleWorkoutPlanActive,
  workoutKeys,
} from "../../hooks/useWorkoutQueries";

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
      <div className="w-[90%] max-w-2xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
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
  "Strength Building",
  "Weight Loss",
  "Muscle Gain",
  "Endurance",
  "General Fitness",
  "Athletic Performance",
  "Rehabilitation",
];

const difficulties = ["Beginner", "Intermediate", "Advanced"];

// Default sort key — must match the initial queryOptions sort value
const DEFAULT_SORT = "-createdAt";

export default function WorkoutPlanClient({ initialPlans = [] }) {
  const queryClient = useQueryClient();

  // Pre-populate TanStack Query cache with SSR data so useWorkoutPlans
  // skips the loading state on first render.
  const defaultQueryKey = workoutKeys.list(JSON.stringify({ sort: DEFAULT_SORT }));
  if (initialPlans.length > 0 && !queryClient.getQueryData(defaultQueryKey)) {
    queryClient.setQueryData(defaultQueryKey, { plans: initialPlans });
  }

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Query options
  const queryOptions = useMemo(
    () => ({
      ...(selectedGoal && { goal: selectedGoal }),
      ...(selectedDifficulty && { difficulty: selectedDifficulty }),
      sort:
        sortBy === "newest"
          ? "-createdAt"
          : sortBy === "oldest"
          ? "createdAt"
          : sortBy === "updated"
          ? "-updatedAt"
          : sortBy === "popular"
          ? "popular"
          : "-createdAt",
    }),
    [selectedGoal, selectedDifficulty, sortBy]
  );

  // React Query hooks
  const {
    data: workoutPlansData,
    isLoading: loading,
    error: fetchError,
    refetch,
  } = useWorkoutPlans(queryOptions);

  const createPlanMutation = useCreateWorkoutPlan();
  const updatePlanMutation = useUpdateWorkoutPlan();
  const deletePlanMutation = useDeleteWorkoutPlan();
  const clonePlanMutation = useCloneWorkoutPlan();
  const toggleActiveMutation = useToggleWorkoutPlanActive();

  // Extract workout plans from the response
  const workoutPlans = useMemo(() => {
    if (workoutPlansData)
      return Array.isArray(workoutPlansData.plans)
        ? workoutPlansData.plans
        : Array.isArray(workoutPlansData)
        ? workoutPlansData
        : [];
    // Fall back to SSR data while client query loads
    return initialPlans;
  }, [workoutPlansData, initialPlans]);

  // Filter plans based on search term
  const filteredPlans = useMemo(() => {
    if (!Array.isArray(workoutPlans)) return [];
    return workoutPlans.filter((plan) => {
      if (!plan) return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (plan.name && plan.name.toLowerCase().includes(searchLower)) ||
        (plan.description &&
          plan.description.toLowerCase().includes(searchLower)) ||
        (plan.goal && plan.goal.toLowerCase().includes(searchLower)) ||
        (plan.targetMuscleGroups &&
          plan.targetMuscleGroups.some((group) =>
            group.toLowerCase().includes(searchLower)
          ))
      );
    });
  }, [workoutPlans, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!Array.isArray(workoutPlans) || workoutPlans.length === 0)
      return { totalPlans: 0, activePlans: 0, averageDuration: 0, totalWorkouts: 0 };
    const activePlans = workoutPlans.filter((p) => p?.isActive);
    const totalDuration = workoutPlans.reduce(
      (sum, plan) => sum + (plan?.duration || 0),
      0
    );
    const totalWorkouts = workoutPlans.reduce(
      (sum, plan) => sum + (plan?.stats?.totalWorkouts || 0),
      0
    );
    return {
      totalPlans: workoutPlans.length,
      activePlans: activePlans.length,
      averageDuration: Math.round(totalDuration / workoutPlans.length),
      totalWorkouts,
    };
  }, [workoutPlans]);

  // Handlers
  const handleCreatePlan = async (planData) => {
    try {
      if (!planData || !planData.name?.trim()) throw new Error("Plan name is required");
      await createPlanMutation.mutateAsync(planData);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating plan:", err);
      throw err;
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
    } catch (err) {
      console.error("Error updating plan:", err);
      throw err;
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!planId) return;
    if (!confirm("Are you sure you want to delete this workout plan?")) return;
    try {
      await deletePlanMutation.mutateAsync(planId);
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Failed to delete plan. Please try again.");
    }
  };

  const handleClonePlan = async (planId, newName) => {
    if (!planId || !newName?.trim()) return;
    try {
      await clonePlanMutation.mutateAsync({ planId, newName });
    } catch (err) {
      console.error("Error cloning plan:", err);
      alert("Failed to clone plan. Please try again.");
    }
  };

  const handleToggleActive = async (planId, isActive) => {
    if (!planId) return;
    try {
      await toggleActiveMutation.mutateAsync({ planId, isActive });
    } catch (err) {
      console.error("Error toggling plan active status:", err);
      alert("Failed to update plan status. Please try again.");
    }
  };

  // ── Auth loading skeleton ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
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

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please log in to access your workout plans
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetching skeleton (only when no SSR data and no cache yet) ────────────
  if (loading && filteredPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
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

  const error =
    fetchError?.message ||
    createPlanMutation.error?.message ||
    updatePlanMutation.error?.message ||
    deletePlanMutation.error?.message ||
    clonePlanMutation.error?.message;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
              Workout Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Design and track your fitness journey with personalized workout plans
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={createPlanMutation.isPending}
            className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>{createPlanMutation.isPending ? "Creating..." : "Create Plan"}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">Total Plans</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPlans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">Active Plans</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activePlans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">Avg Duration</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.averageDuration}w</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
                <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">Total Workouts</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalWorkouts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
          {/* Mobile Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full flex items-center justify-between p-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filters & Search</span>
              {(searchTerm || selectedGoal || selectedDifficulty || sortBy !== "newest") && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {[searchTerm, selectedGoal, selectedDifficulty, sortBy !== "newest"].filter(Boolean).length}
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {/* Filters Content */}
          <div className={`${showFilters ? "block" : "hidden"} lg:block p-6`}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workout plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Goal Filter */}
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="">All Goals</option>
                {goals.map((goal) => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="">All Levels</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="updated">Recently Updated</option>
                <option value="popular">Most Popular</option>
              </select>

              {/* Clear filters */}
              {(searchTerm || selectedGoal || selectedDifficulty || sortBy !== "newest") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedGoal("");
                    setSelectedDifficulty("");
                    setSortBy("newest");
                  }}
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

        {/* Workout Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No workout plans found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedGoal || selectedDifficulty
                  ? "Try adjusting your search or filters"
                  : "Create your first workout plan to get started"}
              </p>
              {!searchTerm && !selectedGoal && !selectedDifficulty && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
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
              if (!plan || !plan._id) return null;
              return (
                <WorkoutPlanCard
                  key={plan._id}
                  plan={plan}
                  onDelete={handleDeletePlan}
                  onClone={handleClonePlan}
                  onEdit={handleEditPlan}
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
            isLoading={createPlanMutation.isPending}
          />
        )}

        {/* Edit Plan Modal */}
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
      </div>
    </div>
  );
}
