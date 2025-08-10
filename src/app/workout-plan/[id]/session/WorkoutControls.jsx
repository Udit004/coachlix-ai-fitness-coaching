// components/workout-session/WorkoutControls.jsx
import React from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import useWorkoutSessionStore from "@/stores/workoutSessionStore";
import { useSaveWorkoutProgress, useCompleteWorkoutSession } from '@/hooks/useWorkoutQueries';

const WorkoutControls = ({
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  exercises, // Add exercises as prop
  onWorkoutComplete,
  onProgressSave,
  isCompleting, // Add these props from parent
  isSaving,
}) => {
  const {
    currentExerciseIndex,
    isPlaying,
    completedExercises,
    notes,
    exerciseData,
    togglePlayback,
    nextExercise,
    previousExercise,
    completeExercise,
    setNotes,
    getCurrentExercise,
  } = useWorkoutSessionStore();

  // Import the mutation hooks here
  const saveProgressMutation = useSaveWorkoutProgress();
  const completeWorkoutMutation = useCompleteWorkoutSession();

  const currentExercise = getCurrentExercise(exercises);

  const handleStartPause = () => {
    togglePlayback();
  };

  const handleNextExercise = () => {
    nextExercise(exercises.length);
  };

  const handlePreviousExercise = () => {
    previousExercise();
  };

  const handleCompleteExercise = () => {
    completeExercise(currentExerciseIndex, exercises.length);
  };

  const handleSaveProgress = async () => {
    try {
      await saveProgressMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseData,
      });

      if (onProgressSave) {
        onProgressSave({ success: true });
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
      if (onProgressSave) {
        onProgressSave({ success: false, error: error.message });
      }
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await completeWorkoutMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        sessionData: {
          exerciseData,
          notes,
          totalTime: useWorkoutSessionStore.getState().timer,
          completedAt: new Date().toISOString(),
        },
      });

      if (onWorkoutComplete) {
        onWorkoutComplete({ success: true });
      }
    } catch (error) {
      console.error("Failed to complete workout:", error);
      if (onWorkoutComplete) {
        onWorkoutComplete({ success: false, error: error.message });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-3">
          <button
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
          >
            <SkipBack className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleStartPause}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            <span>{isPlaying ? "Pause" : "Start"}</span>
          </button>

          <button
            onClick={handleNextExercise}
            disabled={currentExerciseIndex === exercises.length - 1}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
          >
            <span>Next</span>
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSaveProgress}
            disabled={saveProgressMutation.isLoading || isSaving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium"
          >
            {saveProgressMutation.isLoading || isSaving ? "Saving..." : "Save Progress"}
          </button>

          <button
            onClick={handleCompleteExercise}
            disabled={completedExercises.includes(currentExerciseIndex)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Complete Exercise
          </button>

          <button
            onClick={handleCompleteWorkout}
            disabled={completeWorkoutMutation.isLoading || isCompleting}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium"
          >
            {completeWorkoutMutation.isLoading || isCompleting ? "Finishing..." : "Finish Workout"}
          </button>
        </div>
      </div>

      {/* Workout Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Workout Notes
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="How did this workout feel? Any observations..."
        />
      </div>
    </div>
  );
};

export default WorkoutControls;