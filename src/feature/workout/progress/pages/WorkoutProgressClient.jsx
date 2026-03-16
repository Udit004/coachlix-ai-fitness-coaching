"use client";
import { useParams, useRouter } from "next/navigation";
import ProgressTracker from "../components/ProgressTracker";
import { useWorkoutProgressPlan } from "../hooks/useWorkoutProgressQueries";

export default function WorkoutProgressClient() {
  const params = useParams();
  const router = useRouter();
  const planId = params?.id;

  const { data, isLoading, error, refetch } = useWorkoutProgressPlan(planId);
  const plan = data?.plan || data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-72 bg-white dark:bg-gray-800 rounded-xl shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error.message || "Failed to load progress"}
          </p>
          <button
            onClick={() => refetch()}
            className="mr-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push(`/workout-plan/${planId}`)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
          >
            Back To Plan
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Workout plan not found</p>
          <button
            onClick={() => router.push("/workout-plan")}
            className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
          >
            Go To Workout Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProgressTracker
      plan={plan}
      onBack={() => router.back()}
      onClose={() => router.push(`/workout-plan/${planId}`)}
    />
  );
}
