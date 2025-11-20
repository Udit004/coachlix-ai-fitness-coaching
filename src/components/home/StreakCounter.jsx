"use client";
import React from "react";
import { Flame, Zap } from "lucide-react";

/**
 * StreakCounter - Display workout and nutrition streaks
 * @param {number} workoutStreak - Days with consecutive workouts completed
 * @param {number} nutritionStreak - Days with consecutive meal plan adherence
 */
export default function StreakCounter({ workoutStreak = 0, nutritionStreak = 0 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Workout Streak */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg p-4 border border-red-100 dark:border-red-900">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Workout Streak</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-red-600 dark:text-red-400">{workoutStreak}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
        </div>
        {workoutStreak > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Keep it up! 🔥
          </p>
        )}
        {workoutStreak === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Start your streak today!
          </p>
        )}
      </div>

      {/* Nutrition Streak */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-100 dark:border-green-900">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Nutrition Streak</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">{nutritionStreak}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
        </div>
        {nutritionStreak > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Great consistency! ⚡
          </p>
        )}
        {nutritionStreak === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track your meals today!
          </p>
        )}
      </div>
    </div>
  );
}
