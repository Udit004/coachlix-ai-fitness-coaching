// components/workout-session/EmptyState.jsx
import React from 'react';
import { ArrowLeft, Dumbbell, Plus } from 'lucide-react';

const EmptyState = ({ 
  planId, 
  weekNumber, 
  dayNumber, 
  workoutData, 
  onBack, 
  onAddExercise 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {workoutData?.name || "Workout Session"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Week {weekNumber}, Day {dayNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            No Exercises Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            This workout doesn't have any exercises yet. Add some exercises to
            get started with your training session!
          </p>
          <button
            onClick={onAddExercise}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Exercises</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;