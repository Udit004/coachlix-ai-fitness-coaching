import React from "react";

export default function WorkoutWeekOverviewCard({
  activeWeek,
  currentWeek,
  weekProgress,
  plan,
}) {
  if (!currentWeek) return null;

  return (
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Workouts Planned</p>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round((currentWeek.totalDuration || 0) / 60)}h
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Duration</p>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weekProgress}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
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
  );
}
