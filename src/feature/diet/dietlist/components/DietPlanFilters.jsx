"use client";
import React, { useState } from "react";
import { Filter, Search, ChevronDown, ChevronUp } from "lucide-react";

const goals = [
  "Weight Loss",
  "Muscle Gain",
  "Maintenance",
  "Cutting",
  "Bulking",
  "General Health",
];

/**
 * DietPlanFilters — Search and filter controls for diet plans
 */
export default function DietPlanFilters({
  searchTerm,
  onSearchChange,
  selectedGoal,
  onGoalChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}) {
  const [showFilters, setShowFilters] = useState(false);

  const filterCount = [searchTerm, selectedGoal, sortBy !== "newest"].filter(
    Boolean
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="sm:hidden w-full flex items-center justify-between p-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filters & Search</span>
          {hasActiveFilters && filterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-green-600 rounded-full">
              {filterCount}
            </span>
          )}
        </div>
        {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {/* Filters Content */}
      <div className={`${showFilters ? "block" : "hidden"} sm:block p-6`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Goal Filter */}
          <select
            value={selectedGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
          >
            <option value="">All Goals</option>
            {goals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
