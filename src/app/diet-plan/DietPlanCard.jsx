"use client"
import React, { useState } from 'react';
import { Calendar, Target, Clock, MoreVertical, Edit, Trash2, Copy, Eye, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DietPlanCard({ plan, onDelete, onClone }) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleViewPlan = () => {
    router.push(`/diet-plan/${plan._id}`);
  };

  const handleClone = async () => {
    const newName = prompt('Enter name for the cloned plan:', `${plan.name} (Copy)`);
    if (newName && newName.trim()) {
      setLoading(true);
      try {
        await onClone(plan._id, newName.trim());
      } finally {
        setLoading(false);
        setShowMenu(false);
      }
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(plan._id);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const getGoalColor = (goal) => {
    const colors = {
      'Weight Loss': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Muscle Gain': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Maintenance': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Cutting': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Bulking': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'General Health': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[goal] || colors['General Health'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysCompleted = () => {
    // This would be calculated based on user progress data
    // For now, return a mock value
    return Math.floor(Math.random() * plan.duration);
  };

  const avgCalories = plan.days?.length > 0 
    ? Math.round(plan.days.reduce((sum, day) => sum + (day.totalCalories || 0), 0) / plan.days.length)
    : plan.targetCalories;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {plan.name}
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getGoalColor(plan.goal)}`}>
              <Target className="h-3 w-3 mr-1" />
              {plan.goal}
            </span>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={loading}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleViewPlan}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => router.push(`/diet-plans/${plan._id}/edit`)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Plan</span>
                </button>
                <button
                  onClick={handleClone}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  disabled={loading}
                >
                  <Copy className="h-4 w-4" />
                  <span>Clone Plan</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 flex items-center space-x-2 rounded-b-lg"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {plan.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {avgCalories.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Avg Calories/Day
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan.duration}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Days Total
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>Macros (Daily Target)</span>
            <span>{plan.targetProtein + plan.targetCarbs + plan.targetFats}g total</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {plan.targetProtein}g
              </div>
              <div className="text-xs text-gray-500">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {plan.targetCarbs}g
              </div>
              <div className="text-xs text-gray-500">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                {plan.targetFats}g
              </div>
              <div className="text-xs text-gray-500">Fats</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {plan.duration > 1 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{getDaysCompleted()} of {plan.duration} days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(getDaysCompleted() / plan.duration) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(plan.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="capitalize">{plan.difficulty || 'Beginner'}</span>
          </div>
        </div>

        {/* Tags */}
        {plan.tags && plan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {plan.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {plan.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                +{plan.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleViewPlan}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4" />
            <span>View Plan</span>
          </button>
          
          {plan.isActive && (
            <button
              onClick={() => router.push(`/diet-plan/${plan._id}/start`)}
              className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Start Plan"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      {!plan.isActive && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
            Inactive
          </span>
        </div>
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}
    </div>
  );
}