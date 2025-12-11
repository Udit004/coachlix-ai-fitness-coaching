// components/workout-session/WorkoutHeader.jsx
import React from "react";
import { ArrowLeft, Volume2, VolumeX, Save } from "lucide-react";
import useWorkoutSessionStore from "@/stores/workoutSessionStore";
import { useSaveWorkoutProgress } from "@/hooks/useWorkoutQueries";

const WorkoutHeader = ({
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  workoutIndex,
  onBack,
  onProgressSave,
}) => {
  const {
    workoutData,
    planData,
    completedExercises,
    soundEnabled,
    exerciseData,
    notes,
    toggleSound,
    getProgressPercentage,
  } = useWorkoutSessionStore();

  // Import the mutation hook here
  const saveProgressMutation = useSaveWorkoutProgress();

  // Get exercises and progress from store data
  const exercises = workoutData?.exercises || [];
  const progressPercentage = getProgressPercentage(exercises.length);

  const handleSaveProgress = async () => {
    try {
      await saveProgressMutation.mutateAsync({
        planId,
        weekNumber,
        dayNumber,
        workoutIndex,
        exerciseDataMap: exerciseData,
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

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {workoutData?.name || "Workout Session"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {planData?.name} • Week {weekNumber}, Day {dayNumber}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={handleSaveProgress}
              disabled={saveProgressMutation.isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>
                {saveProgressMutation.isLoading ? "Saving..." : "Save Progress"}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {completedExercises.length} of {exercises.length}{" "}
              exercises
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="md:hidden flex items-center justify-center  mt-4 space-x-3">
              <button
                onClick={handleSaveProgress}
                disabled={saveProgressMutation.isLoading}
                className="flex items-center justify-center w-full space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>
                  {saveProgressMutation.isLoading
                    ? "Saving..."
                    : "Save Progress"}
                </span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutHeader;
