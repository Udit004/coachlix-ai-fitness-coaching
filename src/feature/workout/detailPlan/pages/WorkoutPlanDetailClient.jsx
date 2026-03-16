"use client";
import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import ExerciseTargetEditorModal from "../components/ExerciseTargetEditorModal";
import WorkoutPlanDetailHeader from "../components/WorkoutPlanDetailHeader";
import WorkoutWeekNavigationSection from "../components/WorkoutWeekNavigationSection";
import WorkoutWeekOverviewCard from "../components/WorkoutWeekOverviewCard";
import DeleteModal from "@/feature/workout/components/DeleteModal";

export default function WorkoutPlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { success, error: showError } = useToast();
  useAuth();

  const [activeWeek, setActiveWeek] = useState(1);
  const [showAddExercise, setShowAddExercise] = useState(false);
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
      <WorkoutPlanDetailHeader
        planName={plan.name}
        planDescription={plan.description}
        isUpdating={updatePlanMutation.isPending || updatePlanMutation.isLoading}
        onBack={() => router.back()}
        onShowProgress={() => router.push(`/workout-plan/${id}/progress`)}
        onShowEdit={() => setShowEditPlan(true)}
      />

      <div className="max-w-6xl mx-auto p-4">
        <WorkoutWeekNavigationSection
          activeWeek={activeWeek}
          duration={plan.duration}
          weekProgress={weekProgress}
          weeks={plan.weeks}
          currentWeek={currentWeek}
          onSelectWeek={setActiveWeek}
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

        <WorkoutWeekOverviewCard
          activeWeek={activeWeek}
          currentWeek={currentWeek}
          weekProgress={weekProgress}
          plan={plan}
        />
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
