"use client";
import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import useWorkoutSessionStore from "@/stores/workoutSessionStore";
import AddExerciseModal from "../AddExerciseModal";

// Components
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";
import WorkoutHeader from "./WorkoutHeader";
import WorkoutTimer from "./WorkoutTimer";
import RestTimer from "./RestTimer";
import CurrentExercise from "./CurrentExercise";
import WorkoutControls from "./WorkoutControls";
import ExerciseListSidebar from "./ExerciseListSidebar";

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL parameters
  const planId = params.id;
  const weekNumber = parseInt(searchParams.get("week")) || 1;
  const dayNumber = parseInt(searchParams.get("day")) || 1;
  const workoutId = searchParams.get("workout");

  // Store state and actions
  const {
    loading,
    workoutData,
    showAddExerciseModal,
    error,
    loadWorkoutData,
    toggleAddExerciseModal,
    addExercises,
    reset,
    getExercises,
  } = useWorkoutSessionStore();

  const exercises = getExercises();

  // Load workout data on mount
  useEffect(() => {
    if (planId && user) {
      loadWorkoutData(planId, weekNumber, dayNumber, workoutId);
    }
    router.prefetch(`/workout-plan/${planId}`);
    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [planId, user, weekNumber, dayNumber, workoutId, loadWorkoutData, reset]);

  // Handle navigation
  const handleBack = () => {
    router.push(`/workout-plan/${planId}`);
  };

  // Handle progress save with user feedback
  const handleProgressSave = (result) => {
    if (result.success) {
      alert("Progress saved successfully!");
    } else {
      alert("Failed to save progress. Please try again.");
    }
  };

  // Handle workout completion with navigation
  const handleWorkoutComplete = (result) => {
    if (result.success) {
      alert("Workout completed successfully!");
      router.push(`/workout-plan/${planId}`);
    } else {
      alert("Failed to complete workout. Please try again.");
    }
  };

  // Handle adding exercises
  const handleAddExercise = () => {
    toggleAddExerciseModal();
  };

  const handleAddExercisesFromModal = async (selectedExercises) => {
    const result = await addExercises(
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      selectedExercises,
      () => loadWorkoutData(planId, weekNumber, dayNumber, workoutId)
    );

    if (result.success) {
      const exerciseCount = result.count;
      alert(
        `${exerciseCount} exercise${
          exerciseCount !== 1 ? "s" : ""
        } added successfully!`
      );
    } else {
      alert("Failed to add exercises. Please try again.");
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      alert(`Error: ${error}`);
      router.back();
    }
  }, [error, router]);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Empty state - no exercises
  if (!workoutData || exercises.length === 0) {
    return (
      <EmptyState
        planId={planId}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
        workoutData={workoutData}
        onBack={handleBack}
        onAddExercise={handleAddExercise}
      />
    );
  }

  // Main workout session UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <WorkoutHeader
        planId={planId}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
        workoutId={workoutId}
        onBack={handleBack}
        onProgressSave={handleProgressSave}
      />

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Section */}
            <WorkoutTimer />

            {/* Rest Timer */}
            <RestTimer />

            {/* Current Exercise */}
            <CurrentExercise />

            {/* Controls */}
            <WorkoutControls
              planId={planId}
              weekNumber={weekNumber}
              dayNumber={dayNumber}
              workoutId={workoutId}
              onWorkoutComplete={handleWorkoutComplete}
              onProgressSave={handleProgressSave}
            />
          </div>

          {/* Exercise List Sidebar */}
          <ExerciseListSidebar onAddExercise={handleAddExercise} />
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <AddExerciseModal
          onClose={() => toggleAddExerciseModal()}
          onAdd={handleAddExercisesFromModal}
        />
      )}
    </div>
  );
}