"use client";
import React, { useState } from "react";
import {
  MoreVertical,
  Play,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Users,
  Dumbbell,
  Award,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function WorkoutPlanCard({ plan, onDelete, onClone }) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState(`${plan.name} - Copy`);

  // Calculate completion percentage
  const completionPercentage = plan.stats?.completionRate || 0;

  // Format duration
  const formatDuration = (weeks) => {
    if (weeks === 1) return "1 week";
    if (weeks < 4) return `${weeks} weeks`;
    const months = Math.floor(weeks / 4);
    const remainingWeeks = weeks % 4;
    if (remainingWeeks === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
    return `${months}m ${remainingWeeks}w`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Get goal icon
  const getGoalIcon = (goal) => {
    switch (goal) {
      case "Strength Building":
        return <Dumbbell className="h-4 w-4" />;
      case "Weight Loss":
        return <TrendingUp className="h-4 w-4" />;
      case "Muscle Gain":
        return <Target className="h-4 w-4" />;
      case "Endurance":
        return <Clock className="h-4 w-4" />;
      case "Athletic Performance":
        return <Award className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const handleStartWorkout = () => {
    router.push(`/workout-plan/${plan._id}`);
  };

  const handleEdit = () => {
    router.push(`/workout-plan/${plan._id}/edit`);
  };

  const handleClone = async () => {
    if (cloneName.trim()) {
      await onClone(plan._id, cloneName.trim());
      setShowCloneDialog(false);
      setCloneName(`${plan.name} - Copy`);
    }
  };

  const handleDelete = async () => {
    await onDelete(plan._id);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                {plan.name}
              </h3>
              {plan.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {plan.description}
                </p>
              )}
            </div>
            
            <div className="relative ml-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-3" />
                    Edit Plan
                  </button>
                  <button
                    onClick={() => {
                      setShowCloneDialog(true);
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-3" />
                    Clone Plan
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Delete Plan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Goal and Difficulty */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              {getGoalIcon(plan.goal)}
              <span className="text-sm font-medium">{plan.goal}</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(plan.difficulty)}`}>
              {plan.difficulty}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDuration(plan.duration)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {plan.workoutFrequency}x/week
                </p>
              </div>
            </div>
          </div>

          {/* Muscle Groups */}
          {plan.targetMuscleGroups && plan.targetMuscleGroups.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Target Muscles</p>
              <div className="flex flex-wrap gap-1">
                {plan.targetMuscleGroups.slice(0, 3).map((muscle) => (
                  <span
                    key={muscle}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {muscle}
                  </span>
                ))}
                {plan.targetMuscleGroups.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    +{plan.targetMuscleGroups.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {completionPercentage > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {plan.stats && (plan.stats.totalWorkouts > 0 || plan.stats.totalDuration > 0) && (
            <div className="grid grid-cols-2 gap-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.stats.totalWorkouts || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Workouts</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round((plan.stats.totalDuration || 0) / 60) || 0}h
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {plan.isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3" />
                  <span>Inactive</span>
                </>
              )}
              <span>•</span>
              <span>
                {new Date(plan.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <button
              onClick={handleStartWorkout}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play className="h-3 w-3" />
              <span>Start</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clone Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clone Workout Plan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter a name for the cloned workout plan:
            </p>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter plan name..."
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCloneDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={!cloneName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Clone Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}