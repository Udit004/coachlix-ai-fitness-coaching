"use client";
import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Edit,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  useWorkoutPlan,
  useUpdateWorkoutPlan,
  useUpdateExerciseTargets,
  useDeleteExerciseFromWorkout,
  useDeleteWorkoutFromDay,
  useClearWorkoutDay,
} from "../hooks/useWorkoutPlanDetailQueries";
import ProgressTracker from "../components/ProgressTracker";
import DayAccordionList from "../components/DayAccordionList";
import ExerciseTargetEditorModal from "../components/ExerciseTargetEditorModal";
import DeleteModal from "@/feature/workout/components/DeleteModal";

export default function WorkoutPlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { success, error: showError } = useToast();
  useAuth();

  const [activeWeek, setActiveWeek] = useState(1);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [editingExerciseCtx, setEditingExerciseCtx] = useState(null);
  const [deleteCtx, setDeleteCtx] = useState(null);

  // React Query hooks
  const {
    data: planData,
    isLoading: loading,
    error: fetchError,
    refetch,
  } = useWorkoutPlan(id);

  const updatePlanMutation = useUpdateWorkoutPlan();
  const updateExerciseTargetsMutation = useUpdateExerciseTargets();
  const deleteExerciseMutation = useDeleteExerciseFromWorkout();
  const deleteWorkoutMutation = useDeleteWorkoutFromDay();
  const clearDayMutation = useClearWorkoutDay();

  // Extract plan from response
  const plan = planData?.plan || planData;

  // Update active week when plan data changes
  React.useEffect(() => {
    if (plan?.currentWeek) {
      setActiveWeek(plan.currentWeek);
    }
  }, [plan?.currentWeek]);

  // Dynamic imports
  const AddExerciseModal = dynamic(() => import("../components/AddExerciseModal"), {
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

  const EditPlanModal = dynamic(
    () => import("@/feature/workout/planList/components/EditPlanModal"),
    {
    loading: () => (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-[90%] max-w-2xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="flex justify-end space-x-4">
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
    }
  );

  // Handlers
  const handleStartWorkout = (weekNumber, dayNumber, workoutId) => {
    router.push(
      `/workout-plan/${id}/session?week=${weekNumber}&day=${dayNumber}&workout=${workoutId}`
    );
  };

  const handleExerciseModalComplete = async () => {
    await refetch();
    success("Exercise list updated");
    setShowAddExercise(false);
    setSelectedDay(null);
    setSelectedWorkout(null);
  };

  const handleUpdatePlan = async (planId, updateData) => {
    try {
      await updatePlanMutation.mutateAsync({ planId, updateData });
      setShowEditPlan(false);
      success("Workout plan updated");
    } catch (error) {
      showError(error.message || "Failed to update plan");
      throw error;
    }
  };

  const handleSaveExerciseTargets = async (targetUpdates) => {
    if (!editingExerciseCtx) return;

    try {
      await updateExerciseTargetsMutation.mutateAsync({
        planId: id,
        weekNumber: editingExerciseCtx.weekNumber,
        dayNumber: editingExerciseCtx.dayNumber,
        workoutId: editingExerciseCtx.workoutId,
        exerciseIndex: editingExerciseCtx.exerciseIndex,
        targetUpdates,
      });
      success("Exercise targets updated");
      setEditingExerciseCtx(null);
    } catch (err) {
      showError(err.message || "Failed to update exercise targets");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCtx) return;

    try {
      if (deleteCtx.type === "exercise") {
        await deleteExerciseMutation.mutateAsync({
          planId: id,
          weekNumber: deleteCtx.weekNumber,
          dayNumber: deleteCtx.dayNumber,
          workoutId: deleteCtx.workoutId,
          exerciseIndex: deleteCtx.exerciseIndex,
        });
        success("Exercise removed");
      }

      if (deleteCtx.type === "workout") {
        await deleteWorkoutMutation.mutateAsync({
          planId: id,
          weekNumber: deleteCtx.weekNumber,
          dayNumber: deleteCtx.dayNumber,
          workoutId: deleteCtx.workoutId,
        });
        success("Workout deleted");
      }

      if (deleteCtx.type === "day") {
        await clearDayMutation.mutateAsync({
          planId: id,
          weekNumber: deleteCtx.weekNumber,
          dayNumber: deleteCtx.dayNumber,
        });
        success("Day cleared");
      }

      setDeleteCtx(null);
    } catch (err) {
      showError(err.message || "Delete failed");
    }
  };

  // Calculated values
  const currentWeek = useMemo(() => {
    return plan?.weeks?.find((w) => w.weekNumber === activeWeek);
  }, [plan?.weeks, activeWeek]);

  const weekProgress = useMemo(() => {
    if (!currentWeek?.days) return 0;

    const totalWorkouts = currentWeek.days.reduce(
      (total, day) => total + (day.workouts?.length || 0),
      0
    );

    const completedWorkouts = currentWeek.days.reduce(
      (total, day) =>
        total + (day.workouts?.filter((w) => w.isCompleted).length || 0),
      0
    );

    return totalWorkouts > 0
      ? Math.round((completedWorkouts / totalWorkouts) * 100)
      : 0;
  }, [currentWeek]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const error = fetchError?.message;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="mr-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Workout plan not found
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 md:py-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setShowProgress(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => setShowEditPlan(true)}
                disabled={updatePlanMutation.isPending || updatePlanMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 disabled:bg-blue-400 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                <span>
                  {updatePlanMutation.isPending || updatePlanMutation.isLoading
                    ? "Updating..."
                    : "Edit Plan"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-4 flex items-center justify-end gap-2 md:hidden">
          <button
            onClick={() => setShowProgress(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white"
          >
            <TrendingUp className="h-4 w-4" />
            Progress
          </button>
          <button
            onClick={() => setShowEditPlan(true)}
            disabled={updatePlanMutation.isPending || updatePlanMutation.isLoading}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>

        {/* Week Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Week {activeWeek} of {plan.duration}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Progress: {weekProgress}%
              </span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${weekProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Week Selector */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {plan.weeks?.map((week) => (
              <button
                key={week.weekNumber}
                onClick={() => setActiveWeek(week.weekNumber)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeWeek === week.weekNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Week {week.weekNumber}
              </button>
            ))}
          </div>

          {currentWeek && (
            <DayAccordionList
              weekNumber={activeWeek}
              days={currentWeek.days || []}
              onStartWorkout={handleStartWorkout}
              onAddExercise={(dayNumber, workoutId) => {
                setSelectedDay(dayNumber);
                setSelectedWorkout(workoutId);
                setShowAddExercise(true);
              }}
              onDeleteDay={(ctx) => setDeleteCtx({ type: "day", ...ctx })}
              onDeleteWorkout={(ctx) => setDeleteCtx({ type: "workout", ...ctx })}
              onEditExercise={(ctx) => setEditingExerciseCtx(ctx)}
              onDeleteExercise={(ctx) => setDeleteCtx({ type: "exercise", ...ctx })}
              isActionPending={
                deleteExerciseMutation.isPending ||
                deleteWorkoutMutation.isPending ||
                clearDayMutation.isPending ||
                updateExerciseTargetsMutation.isPending
              }
            />
          )}
        </div>

        {/* Current Week Details */}
        {currentWeek && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Week {activeWeek} Overview
            </h3>

            {currentWeek.weeklyGoal && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Goal:</strong> {currentWeek.weeklyGoal}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentWeek.totalWorkouts || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Workouts Planned
                </p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((currentWeek.totalDuration || 0) / 60)}h
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Duration
                </p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {weekProgress}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Frequency</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.workoutFrequency || 0}x / week
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">{plan.duration} weeks</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Calories</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.stats?.totalCalories || 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Avg Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.stats?.averageWorkoutDuration || 0} min
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddExercise && (
        <AddExerciseModal
          onClose={() => {
            setShowAddExercise(false);
            setSelectedDay(null);
            setSelectedWorkout(null);
          }}
          onAdd={handleExerciseModalComplete}
          planId={plan._id}
          weekNumber={activeWeek}
          dayNumber={selectedDay}
          workoutId={selectedWorkout}
        />
      )}

      {showProgress && (
        <ProgressTracker plan={plan} onClose={() => setShowProgress(false)} />
      )}

      {showEditPlan && (
        <EditPlanModal
          plan={plan}
          onClose={() => setShowEditPlan(false)}
          onUpdate={handleUpdatePlan}
          isLoading={updatePlanMutation.isPending || updatePlanMutation.isLoading}
        />
      )}

      <ExerciseTargetEditorModal
        isOpen={!!editingExerciseCtx}
        exercise={editingExerciseCtx?.exercise || null}
        isSaving={updateExerciseTargetsMutation.isPending}
        onClose={() => setEditingExerciseCtx(null)}
        onSave={handleSaveExerciseTargets}
      />

      <DeleteModal
        isOpen={!!deleteCtx}
        onClose={() => setDeleteCtx(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteCtx?.type === "exercise"
            ? "Remove Exercise"
            : deleteCtx?.type === "workout"
            ? "Delete Workout"
            : "Clear Day"
        }
        description={
          deleteCtx?.type === "exercise"
            ? "This exercise will be removed from the workout."
            : deleteCtx?.type === "workout"
            ? "This workout and all its exercise assignments will be removed from the day."
            : "All workouts will be removed from this day and it will become a rest day."
        }
        itemName={
          deleteCtx?.type === "exercise"
            ? deleteCtx?.exercise?.name || "Exercise"
            : deleteCtx?.type === "workout"
            ? deleteCtx?.workoutName || "Workout"
            : deleteCtx?.dayName || "Day"
        }
        isLoading={
          deleteExerciseMutation.isPending ||
          deleteWorkoutMutation.isPending ||
          clearDayMutation.isPending
        }
      />
    </div>
  );
}
