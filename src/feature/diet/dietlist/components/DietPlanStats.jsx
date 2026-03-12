"use client";
import React from "react";
import {
  Calendar,
  Target,
  TrendingUp,
} from "lucide-react";

/**
 * StatCard — Reusable component for displaying individual stats
 */
function StatCard({ icon: Icon, label, value, bgColor, iconBgColor, iconColor }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm sm:p-4">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:space-x-3">
        <div className={`p-2 ${iconBgColor} rounded-lg flex-shrink-0 mb-2 sm:mb-0`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">
            {label}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * DietPlanStats — Display summary statistics for diet plans
 */
export default function DietPlanStats({
  totalPlans,
  activeCount,
  averageCalories,
}) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6 sm:gap-4">
      <StatCard
        icon={Calendar}
        label="Total Plans"
        value={totalPlans}
        iconBgColor="bg-blue-100 dark:bg-blue-900"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        icon={Target}
        label="Active Plans"
        value={activeCount}
        iconBgColor="bg-green-100 dark:bg-green-900"
        iconColor="text-green-600 dark:text-green-400"
      />
      <StatCard
        icon={TrendingUp}
        label="Avg Calories"
        value={averageCalories.toLocaleString()}
        iconBgColor="bg-purple-100 dark:bg-purple-900"
        iconColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
}
