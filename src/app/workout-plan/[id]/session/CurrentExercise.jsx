// components/workout-session/CurrentExercise.jsx
import React from 'react';
import useWorkoutSessionStore from '@/stores/workoutSessionStore';

const CurrentExercise = ({ currentExercise, exercises }) => {
  const {
    currentExerciseIndex,
    currentSet,
    exerciseData,
    addCompletedSet,
    updateExerciseNotes,
  } = useWorkoutSessionStore();

  const handleSetComplete = () => {
    const repsInput = document.getElementById(`reps-${currentExerciseIndex}`);
    const weightInput = document.getElementById(`weight-${currentExerciseIndex}`);
    
    const reps = repsInput.value;
    const weight = weightInput.value;
    
    if (reps) {
      addCompletedSet(currentExerciseIndex, {
        reps: parseInt(reps) || 0,
        weight: parseFloat(weight) || null,
      });
      
      // Clear inputs
      repsInput.value = '';
      weightInput.value = '';
    }
  };

  const handleNotesChange = (e) => {
    updateExerciseNotes(currentExerciseIndex, e.target.value);
  };

  // Use the props instead of trying to get from store
  if (!currentExercise || !exercises) {
    console.log('⚠️ [CurrentExercise] Missing data:', { 
      hasCurrentExercise: !!currentExercise, 
      hasExercises: !!exercises 
    });
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <p className="text-center text-gray-500">No exercise data available</p>
      </div>
    );
  }

  console.log('🎯 [CurrentExercise] Rendering exercise:', currentExercise.name);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {currentExercise.name}
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </span>
      </div>

      {currentExercise.instructions && (
        <p className="text-gray-700 dark:text-gray-300 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {currentExercise.instructions}
        </p>
      )}

      {/* Exercise Details */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Target Sets
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {currentExercise.targetSets || currentExercise.sets || 3}
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Target Reps
          </p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {currentExercise.targetReps || currentExercise.reps || "8-12"}
          </p>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Weight
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {currentExercise.targetWeight || currentExercise.weight
              ? `${currentExercise.targetWeight || currentExercise.weight}kg`
              : "Body weight"}
          </p>
        </div>
      </div>

      {/* Set Tracking */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Current Set: {currentSet}
        </h4>
        <div className="flex flex-col space-y-3 md:flex-row md:space-x-3">
          <input
            type="number"
            placeholder="Reps"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id={`reps-${currentExerciseIndex}`}
          />
          <input
            type="number"
            step="0.5"
            placeholder="Weight (kg)"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id={`weight-${currentExerciseIndex}`}
          />
          <button
            onClick={handleSetComplete}
            className="px-4 py-2 h-13 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Complete Set
          </button>
        </div>
      </div>

      {/* Completed Sets */}
      {exerciseData[currentExerciseIndex]?.sets?.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Completed Sets:
          </h4>
          <div className="space-y-2">
            {exerciseData[currentExerciseIndex].sets.map((set, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg"
              >
                <span className="font-medium">Set {set.set}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {set.reps} reps{" "}
                  {set.weight ? `@ ${set.weight}kg` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Exercise Notes
        </label>
        <textarea
          value={exerciseData[currentExerciseIndex]?.notes || ""}
          onChange={handleNotesChange}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="Add notes about this exercise..."
        />
      </div>
    </div>
  );
};

export default CurrentExercise;