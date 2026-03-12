"use client";
import React from "react";
import { AlertCircle, Calendar } from "lucide-react";

/**
 * ErrorState — Display error message with retry option
 */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
        <p className="text-red-800 dark:text-red-200">
          Error: {error?.message || "Failed to load diet plans"}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * EmptyState — Display when no diet plans are found
 */
export function EmptyState({ hasAnyFilters, onCreateClick }) {
  return (
    <div className="text-center py-12">
      <div className="max-w-sm mx-auto">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No diet plans found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {hasAnyFilters
            ? "Try adjusting your search or filters"
            : "Create your first diet plan to get started"}
        </p>
        {!hasAnyFilters && (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
          >
            <span>+</span>
            <span>Create Your First Plan</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * AuthErrorState — Display authentication error
 */
export function AuthErrorState({ error, onReload }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Authentication Error
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-6">
              {error?.message || "Failed to authenticate"}
            </p>
            <button
              onClick={onReload}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * NotAuthenticatedState — Display when user is not authenticated
 */
export function NotAuthenticatedState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please log in to access your diet plans
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingSkeleton — Display loading skeletons while fetching data
 */
export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
