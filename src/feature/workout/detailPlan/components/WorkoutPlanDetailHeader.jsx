import React from "react";
import { ArrowLeft, Edit, TrendingUp } from "lucide-react";

export default function WorkoutPlanDetailHeader({
  planName,
  planDescription,
  isUpdating,
  onBack,
  onShowProgress,
  onShowEdit,
}) {
  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 md:py-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {planName}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">{planDescription}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={onShowProgress}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Progress</span>
              </button>
              <button
                onClick={onShowEdit}
                disabled={isUpdating}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 disabled:bg-blue-400 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                <span>{isUpdating ? "Updating..." : "Edit Plan"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-end gap-2 md:hidden">
        <button
          onClick={onShowProgress}
          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white"
        >
          <TrendingUp className="h-4 w-4" />
          Progress
        </button>
        <button
          onClick={onShowEdit}
          disabled={isUpdating}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>
      </div>
    </>
  );
}
