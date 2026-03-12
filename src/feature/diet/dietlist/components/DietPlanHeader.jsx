"use client";
import React from "react";
import { Plus } from "lucide-react";

/**
 * DietPlanHeader — Displays the page title and "Create Plan" button
 */
export default function DietPlanHeader({
  onCreateClick,
  isCreating,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
          Diet Plans
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your nutrition plans and track your goals
        </p>
      </div>
      <button
        onClick={onCreateClick}
        disabled={isCreating}
        className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
      >
        <Plus className="h-5 w-5" />
        <span>{isCreating ? "Creating..." : "Create Plan"}</span>
      </button>
    </div>
  );
}
