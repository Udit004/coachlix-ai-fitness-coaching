"use client";
import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import useWorkoutSessionStore from "@/stores/workoutSessionStore";
import { 
  useWorkoutSession, 
  useSaveWorkoutProgress, 
  useCompleteWorkoutSession, 
  useAddExercisesToWorkout 
} from "../../../../hooks/useWorkoutQueries";
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

  // React Query hooks
  const { 
    data: sessionData, 
    isLoading: loading, 
    error: fetchError 
  } = useWorkoutSession(planId, weekNumber, dayNumber, workoutId);

  const saveProgressMutation = useSaveWorkoutProgress();
  const completeWorkoutMutation = useCompleteWorkoutSession();
  const addExercisesMutation = useAddExercisesToWorkout();

  // Store state and actions
  const {
    showAddExerciseModal,
    exerciseData,
    timer,
    completedExercises,
    notes,
    toggleAddExerciseModal,
    reset,
    initializeExerciseData,
    getCurrentExercise,
    getProgressPercentage,
  } = useWorkoutSessionStore();

  // Extract data from response
  const plan = sessionData?.plan;
  const workoutData = sessionData?.workout;
  const exercises = workoutData?.exercises || [];

  // Initialize exercise data when workout data changes
  useEffect(() => {
    if (workoutData) {
      initializeExerciseData(workoutData);
    }
  }, [workoutData, initializeExerciseData]);

  // Prefetch return route
  useEffect(() => {
    router.prefetch(`/workout-plan/${planId}`);
  }, [planId, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Handle navigation
  const handleBack = () => {
    router.push(`/workout-plan/${planId}`);
  };

  // Handle progress save with user feedback
  const handleProgressSave = async () => {
    try {
      await saveProgressMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseData,
      });
      
      alert("Progress saved successfully!");
      return { success: true };
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Failed to save progress. Please try again.");
      return { success: false, error: error.message };
    }
  };

  // Handle workout completion with navigation
  const handleWorkoutComplete = async () => {
    try {
      const sessionDataToSave = {
        duration: Math.floor(timer / 60),
        totalExercises: exercises.length,
        completedExercises: completedExercises.length,
        totalSets: Object.values(exerciseData).reduce(
          (total, ex) => total + (ex.sets?.length || 0),
          0
        ),
        exercises: Object.keys(exerciseData).map((index) => ({
          exerciseIndex: parseInt(index),
          completed: exerciseData[index].completed,
          actualSets: exerciseData[index].sets,
          notes: exerciseData[index].notes,
        })),
        notes: notes,
        averageIntensity: workoutData?.intensity || "Moderate",
      };

      await completeWorkoutMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        sessionData: sessionDataToSave,
      });

      alert("Workout completed successfully!");
      router.push(`/workout-plan/${planId}`);
      return { success: true };
    } catch (error) {
      console.error("Error completing workout:", error);
      alert("Failed to complete workout. Please try again.");
      return { success: false, error: error.message };
    }
  };

  // Handle adding exercises
  const handleAddExercise = () => {
    toggleAddExerciseModal();
  };

  const handleAddExercisesFromModal = async (selectedExercises) => {
    try {
      await addExercisesMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exercises: selectedExercises,
      });

      const exerciseCount = selectedExercises.length;
      alert(
        `${exerciseCount} exercise${
          exerciseCount !== 1 ? "s" : ""
        } added successfully!`
      );
      
      return { success: true, count: exerciseCount };
    } catch (error) {
      console.error("Error adding exercises:", error);
      alert("Failed to add exercises. Please try again.");
      return { success: false, error: error.message };
    }
  };

  // Handle errors
  const error = fetchError?.message;
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

  // Get current exercise and progress
  const currentExercise = getCurrentExercise(exercises);
  const progressPercentage = getProgressPercentage(exercises.length);

  // Main workout session UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <WorkoutHeader
        planId={planId}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
        workoutId={workoutId}
        workoutData={workoutData}
        onBack={handleBack}
        onProgressSave={handleProgressSave}
        isSaving={saveProgressMutation.isLoading}
        progressPercentage={progressPercentage}
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
            <CurrentExercise 
              currentExercise={currentExercise}
              exercises={exercises}
            />

            {/* Controls */}
            <WorkoutControls
              planId={planId}
              weekNumber={weekNumber}
              dayNumber={dayNumber}
              workoutId={workoutId}
              exercises={exercises}
              onWorkoutComplete={handleWorkoutComplete}
              onProgressSave={handleProgressSave}
              isCompleting={completeWorkoutMutation.isLoading}
              isSaving={saveProgressMutation.isLoading}
            />
          </div>

          {/* Exercise List Sidebar */}
          <ExerciseListSidebar 
            exercises={exercises}
            onAddExercise={handleAddExercise}
          />
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <AddExerciseModal
          onClose={() => toggleAddExerciseModal()}
          onAdd={handleAddExercisesFromModal}
          planId={planId}
          weekNumber={weekNumber}
          dayNumber={dayNumber}
          workoutId={workoutId}
          isLoading={addExercisesMutation.isLoading}
        />
      )}
    </div>
  );
}