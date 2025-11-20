import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Target,
  Users,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  TrendingUp,
  Award,
  Dumbbell,
  Power,
} from "lucide-react";

export default function WorkoutPlanCard({ plan, onDelete, onClone, onEdit, onToggleActive }) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleClone = async () => {
    const newName = prompt("Enter a name for the cloned plan:", `${plan.name} (Copy)`);
    if (newName && newName.trim()) {
      setIsCloning(true);
      try {
        await onClone(plan._id, newName.trim());
      } catch (error) {
        console.error("Error cloning plan:", error);
      } finally {
        setIsCloning(false);
        setShowDropdown(false);
      }
    }
  };

  const handleEdit = () => {
    onEdit(plan);
    setShowDropdown(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      await onDelete(plan._id);
    }
    setShowDropdown(false);
  };

  const handleToggleActive = async () => {
    if (!onToggleActive) return;
    setIsTogglingActive(true);
    try {
      await onToggleActive(plan._id, !plan.isActive);
    } catch (error) {
      console.error("Error toggling plan status:", error);
    } finally {
      setIsTogglingActive(false);
      setShowDropdown(false);
    }
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on dropdown or its children
    if (e.target.closest('.dropdown-container')) {
      return;
    }
    router.push(`/workout-plan/${plan._id}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getProgressPercentage = () => {
    if (!plan.weeks || plan.weeks.length === 0) return 0;
    
    const completedWeeks = plan.weeks.filter(week => week.completed).length;
    return Math.round((completedWeeks / plan.weeks.length) * 100);
  };

  const getTotalWorkouts = () => {
    if (!plan.weeks || plan.weeks.length === 0) return 0;
    
    return plan.weeks.reduce((total, week) => {
      return total + (week.days || []).filter(day => !day.isRestDay && day.workouts?.length > 0).length;
    }, 0);
  };

  const getCompletedWorkouts = () => {
    return plan.stats?.totalWorkouts || 0;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {plan.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
              {plan.description || "No description provided"}
            </p>
          </div>
          
          {/* Dropdown Menu */}
          <div className="dropdown-container relative ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                  <div className="py-1">
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Plan</span>
                    </button>
                    
                    <button
                      onClick={handleClone}
                      disabled={isCloning}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4" />
                      <span>{isCloning ? "Cloning..." : "Clone Plan"}</span>
                    </button>
                    
                    <button
                      onClick={handleToggleActive}
                      disabled={isTogglingActive}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Power className="h-4 w-4" />
                      <span>{isTogglingActive ? "Updating..." : (plan.isActive ? "Mark as Inactive" : "Mark as Active")}</span>
                    </button>
                    
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Plan</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Goal and Difficulty */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(plan.difficulty)}`}>
            {plan.difficulty || "Beginner"}
          </span>
          <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
            <Target className="h-4 w-4 mr-1" />
            <span>{plan.goal || "General Fitness"}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {plan.duration || 0} weeks
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {plan.workoutFrequency || 0}x/week
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Frequency</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Dumbbell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getCompletedWorkouts()}/{getTotalWorkouts()}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Workouts</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Award className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {plan.stats?.completionRate || 0}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Muscle Groups */}
      {plan.targetMuscleGroups && plan.targetMuscleGroups.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1">
            {plan.targetMuscleGroups.slice(0, 3).map((muscle, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
              >
                {muscle}
              </span>
            ))}
            {plan.targetMuscleGroups.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                +{plan.targetMuscleGroups.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="px-6 pb-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/workout-plan/${plan._id}`);
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors group/btn"
        >
          <Play className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
          <span>Start Workout</span>
        </button>
      </div>

      {/* Active Status Indicator */}
      <div className="absolute top-4 right-4">
        {plan.isActive ? (
          <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
            Inactive
          </span>
        )}
      </div>
    </div>
  );
}