"use client";
import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/auth/AuthContext"; // FIXED: Use correct auth context
import useWorkoutSessionStore from "@/stores/workoutSessionStore";
import {
  useWorkoutSession,
  useSaveWorkoutProgress,
  useCompleteWorkoutSession,
  useAddExercisesToWorkout,
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
  const { user } = useAuthContext(); // FIXED: Use correct auth context

  // URL parameters
  const planId = params.id;
  const weekNumber = parseInt(searchParams.get("week")) || 1;
  const dayNumber = parseInt(searchParams.get("day")) || 1;
  const workoutId = searchParams.get("workout");

  console.log("🎯 Page params:", { planId, weekNumber, dayNumber, workoutId });

  // React Query hooks
  const {
    data: sessionData,
    isLoading: loading,
    error: fetchError,
    refetch,
  } = useWorkoutSession(planId, weekNumber, dayNumber, workoutId);

  console.log("📊 Session data:", sessionData);
  console.log("⏳ Loading:", loading);
  console.log("🚨 Error:", fetchError);

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

  console.log("🏠 Page.jsx - Store State Debug:", {
    exerciseData,
    exerciseDataType: typeof exerciseData,
    exerciseDataKeys: exerciseData ? Object.keys(exerciseData) : "undefined",
    timer,
    completedExercises,
    notes,
    sessionDataExists: !!sessionData,
    workoutDataExists: !!sessionData?.workout,
    exercisesCount: sessionData?.workout?.exercises?.length || 0,
  });

  // Extract data from response
  const plan = sessionData?.plan;
  const workoutData = sessionData?.workout;
  const exercises = workoutData?.exercises || [];
  const workoutIndex = sessionData?.workoutIndex;

  console.log("🏋️ Extracted data:", {
    plan: !!plan,
    workoutData: !!workoutData,
    workoutName: workoutData?.name,
    exercisesCount: exercises.length,
    exerciseNames: exercises.map((e) => e.name),
  });

  useEffect(() => {
    if (sessionData?.workout && sessionData?.plan) {
      console.log("🔄 Setting workout data in store...");
      console.log("📊 Workout data to initialize:", {
        workoutName: sessionData.workout.name,
        exerciseCount: sessionData.workout.exercises?.length || 0,
        exercises: sessionData.workout.exercises?.map((e) => e.name),
      });

      try {
        // Set the workout data in store first
        useWorkoutSessionStore
          .getState()
          .setWorkoutData(sessionData.workout, sessionData.plan);

        // Then initialize exercise data
        initializeExerciseData(sessionData.workout);

        console.log("✅ Store initialization completed");
      } catch (initError) {
        console.error("❌ Error initializing store:", initError);
      }
    } else {
      console.warn("⚠️ Missing session data for store initialization:", {
        hasSessionData: !!sessionData,
        hasWorkout: !!sessionData?.workout,
        hasPlan: !!sessionData?.plan,
      });
    }
  }, [sessionData, initializeExerciseData]);

  // FIXED: Initialize exercise data when workout data changes
  useEffect(() => {
    if (sessionData?.workout && sessionData?.plan) {
      console.log("🔄 Setting workout data in store...");

      // Set the workout data in store first
      useWorkoutSessionStore
        .getState()
        .setWorkoutData(sessionData.workout, sessionData.plan);

      // Then initialize exercise data
      initializeExerciseData(sessionData.workout);
    }
  }, [sessionData, initializeExerciseData]);

  // Debug exercise data updates
  useEffect(() => {
    console.log("📈 Exercise data updated:", exerciseData);
  }, [exerciseData]);

  // Prefetch return route
  useEffect(() => {
    router.prefetch(`/workout-plan/${planId}`);
  }, [planId, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up workout session...");
      reset();
    };
  }, [reset]);

  // Handle navigation
  const handleBack = () => {
    router.push(`/workout-plan/${planId}`);
  };

  // FIXED: Handle adding exercises with immediate refetch
  const handleAddExercisesFromModal = async (selectedExercises) => {
    try {
      console.log("➕ Adding exercises:", selectedExercises);

      await addExercisesMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exercises: selectedExercises,
      });

      const exerciseCount = selectedExercises.length;
      console.log(`✅ Added ${exerciseCount} exercises successfully`);

      // Immediately refetch the session data to show new exercises
      await refetch();

      alert(
        `${exerciseCount} exercise${
          exerciseCount !== 1 ? "s" : ""
        } added successfully!`
      );

      return { success: true, count: exerciseCount };
    } catch (error) {
      console.error("❌ Error adding exercises:", error);
      alert("Failed to add exercises. Please try again.");
      return { success: false, error: error.message };
    }
  };

  // Handle errors
  const error = fetchError?.message;
  useEffect(() => {
    if (error) {
      console.error("🚨 Session page error:", error);
      alert(`Error: ${error}`);
      // Don't auto-navigate back for debugging
      // router.back();
    }
  }, [error]);

  // FIXED: Better loading state
  if (loading) {
    console.log("⏳ Showing loading state...");
    return <LoadingState />;
  }

  // FIXED: Better error handling
  if (error) {
    console.log("🚨 Showing error state...");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Workout
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Better empty state handling
  if (!workoutData) {
    console.log("🚫 No workout data found");
    return (
      <EmptyState
        planId={planId}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
        workoutData={null}
        onBack={handleBack}
        onAddExercise={() => toggleAddExerciseModal()}
        message="Workout not found"
      />
    );
  }

  if (exercises.length === 0) {
    console.log("📝 No exercises found, showing empty state");
    return (
      <EmptyState
        planId={planId}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
        workoutData={workoutData}
        onBack={handleBack}
        onAddExercise={() => toggleAddExerciseModal()}
        message="No exercises in this workout yet"
      />
    );
  }

  // Get current exercise and progress
  const currentExercise = getCurrentExercise(exercises);
  const progressPercentage = getProgressPercentage(exercises.length);

  console.log("🎯 Rendering main UI:", {
    currentExercise: currentExercise?.name,
    progressPercentage,
    exerciseCount: exercises.length,
  });

  // Main workout session UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-yellow-100 p-2 text-xs">
          <strong>Debug:</strong> Plan: {plan?.name} | Workout:{" "}
          {workoutData?.name} | Exercises: {exercises.length} | Current:{" "}
          {currentExercise?.name}
        </div>
      )}

      {/* Header */}
      <WorkoutHeader
        planId={planId}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
        workoutId={workoutId}
        workoutIndex={workoutIndex}
        onBack={handleBack}
        onProgressSave={(result) => {
          console.log("Progress save result:", result);
          if (result.success) {
            alert("Progress saved successfully!");
          } else {
            alert(`Failed to save progress: ${result.error}`);
          }
        }}
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
              workoutIndex={workoutIndex}
              exercises={exercises}
              onWorkoutComplete={() =>
                console.log("Workout complete requested")
              }
              onProgressSave={() => console.log("Progress save requested")}
              isCompleting={completeWorkoutMutation.isLoading}
              isSaving={saveProgressMutation.isLoading}
            />
          </div>

          {/* Exercise List Sidebar */}
          <ExerciseListSidebar
            exercises={exercises}
            onAddExercise={() => toggleAddExerciseModal()}
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
