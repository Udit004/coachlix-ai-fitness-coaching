// components/workout-session/ExerciseListSidebar.jsx
import React from 'react';
import { CheckCircle, Circle, Plus } from 'lucide-react';
import useWorkoutSessionStore from '@/stores/workoutSessionStore';

const ExerciseListSidebar = ({ onAddExercise }) => {
  const {
    currentExerciseIndex,
    completedExercises,
    exerciseData,
    setCurrentExerciseIndex,
  getCurrentExercise,
  } = useWorkoutSessionStore();

  // Get exercises from workoutData (assume it's available in the store or via props/context)
  const workoutData = useWorkoutSessionStore.getState().workoutData || {};
  const exercises = workoutData.exercises || [];

  const handleExerciseClick = (index) => {
    setCurrentExerciseIndex(index);
  };

  const handleAddExercise = () => {
    if (onAddExercise) {
      onAddExercise();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm h-fit sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Exercise List
        </h3>
        <button
          onClick={handleAddExercise}
          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Add Exercise"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {exercises.map((exercise, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
              index === currentExerciseIndex
                ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600"
                : completedExercises.includes(index)
                ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => handleExerciseClick(index)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {exercise.name}
              </span>
              {completedExercises.includes(index) ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : index === currentExerciseIndex ? (
                <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                {exercise.targetSets || 3} sets ×{" "}
                {exercise.targetReps || "8-12"} reps
              </p>
              {exerciseData[index]?.sets?.length > 0 && (
                <p className="text-green-600 dark:text-green-400 font-medium">
                  {exerciseData[index].sets.length} sets completed
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseListSidebar;