"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Target, Clock, MoreVertical, Edit, Trash2, Copy, Eye, Play, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DietPlanCard({ plan, onDelete, onClone, onEdit, onToggleActive }) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const router = useRouter();
  const menuRef = useRef(null);

  // Validate required props
  if (!plan) {
    console.warn('DietPlanCard: plan prop is required');
    return null;
  }

  if (!plan._id && !plan.id) {
    console.warn('DietPlanCard: plan must have an _id or id property');
    return null;
  }

  // Get plan ID safely
  const planId = plan._id || plan.id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Close menu on escape key
  useEffect(() => {

    router.prefetch(`/diet-plan/${planId}`);
    router.prefetch(`/diet-plans/${planId}/edit`);
    router.prefetch(`/diet-plan/${planId}/start`);  

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showMenu]);

  const handleViewPlan = () => {
    if (!planId) {
      console.error('Cannot view plan: missing ID');
      return;
    }
    
    try {
      router.push(`/diet-plan/${planId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleEditPlan = () => {
    if (!planId) {
      console.error('Cannot edit plan: missing ID');
      return;
    }
    if (typeof onEdit === 'function') {
      onEdit(plan);
      return;
    }
    try {
      router.push(`/diet-plans/${planId}/edit`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleStartPlan = () => {
    if (!planId) {
      console.error('Cannot start plan: missing ID');
      return;
    }
    
    try {
      router.push(`/diet-plan/${planId}/start`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleClone = async () => {
    if (!onClone || typeof onClone !== 'function') {
      console.error('onClone prop is required and must be a function');
      return;
    }

    if (!planId) {
      console.error('Cannot clone plan: missing ID');
      return;
    }

    const newName = prompt('Enter name for the cloned plan:', `${plan.name || 'Untitled Plan'} (Copy)`);
    if (newName && newName.trim()) {
      setLoading(true);
      try {
        await onClone(planId, newName.trim());
      } catch (error) {
        console.error('Error cloning plan:', error);
        alert('Failed to clone plan. Please try again.');
      } finally {
        setLoading(false);
        setShowMenu(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete || typeof onDelete !== 'function') {
      console.error('onDelete prop is required and must be a function');
      return;
    }

    if (!planId) {
      console.error('Cannot delete plan: missing ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(planId);
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleToggleActive = async () => {
    if (!onToggleActive || typeof onToggleActive !== 'function') {
      console.error('onToggleActive prop is required and must be a function');
      return;
    }

    if (!planId) {
      console.error('Cannot toggle plan status: missing ID');
      return;
    }

    setIsTogglingActive(true);
    try {
      await onToggleActive(planId, !planIsActive);
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Failed to update plan status. Please try again.');
    } finally {
      setIsTogglingActive(false);
      setShowMenu(false);
    }
  };

  const getGoalColor = (goal) => {
    if (!goal || typeof goal !== 'string') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    
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
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  };

  const getDaysCompleted = () => {
    // This would be calculated based on user progress data
    // For now, return a mock value with bounds checking
    const duration = Number(plan.duration) || 1;
    return Math.floor(Math.random() * duration);
  };

  const calculateAvgCalories = () => {
    if (plan.days && Array.isArray(plan.days) && plan.days.length > 0) {
      const totalCalories = plan.days.reduce((sum, day) => {
        return sum + (Number(day?.totalCalories) || 0);
      }, 0);
      return Math.round(totalCalories / plan.days.length);
    }
    return Number(plan.targetCalories) || 0;
  };

  const calculateTotalMacros = () => {
    const protein = Number(plan.targetProtein) || 0;
    const carbs = Number(plan.targetCarbs) || 0;
    const fats = Number(plan.targetFats) || 0;
    return protein + carbs + fats;
  };

  const calculateProgress = () => {
    const duration = Number(plan.duration) || 1;
    const completed = getDaysCompleted();
    return Math.min((completed / duration) * 100, 100);
  };

  // Safe property access with defaults
  const planName = plan.name || 'Untitled Plan';
  const planDescription = plan.description || '';
  const planGoal = plan.goal || 'General Health';
  const planDuration = Number(plan.duration) || 1;
  const planDifficulty = plan.difficulty || 'Beginner';
  const planTags = Array.isArray(plan.tags) ? plan.tags : [];
  const planIsActive = Boolean(plan.isActive);
  const avgCalories = calculateAvgCalories();
  const totalMacros = calculateTotalMacros();
  const progressPercentage = calculateProgress();
  const daysCompleted = getDaysCompleted();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 group relative">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0"> {/* min-w-0 prevents text overflow issues */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 break-words">
              {planName}
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getGoalColor(planGoal)}`}>
              <Target className="h-3 w-3 mr-1 flex-shrink-0" />
              {planGoal}
            </span>
          </div>
          
          {/* Actions Menu */}
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
              disabled={loading}
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    handleViewPlan();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
                >
                  <Eye className="h-4 w-4 flex-shrink-0" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => {
                    handleEditPlan();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4 flex-shrink-0" />
                  <span>Edit Plan</span>
                </button>
                <button
                  onClick={handleClone}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  disabled={loading}
                >
                  <Copy className="h-4 w-4 flex-shrink-0" />
                  <span>Clone Plan</span>
                </button>
                <button
                  onClick={handleToggleActive}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  disabled={isTogglingActive || loading}
                >
                  <Power className="h-4 w-4 flex-shrink-0" />
                  <span>{isTogglingActive ? 'Updating...' : (planIsActive ? 'Mark as Inactive' : 'Mark as Active')}</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 flex items-center space-x-2 rounded-b-lg"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                  <span>Delete Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {planDescription && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 break-words">
            {planDescription}
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
              {planDuration}
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
            <span>{totalMacros}g total</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {Number(plan.targetProtein) || 0}g
              </div>
              <div className="text-xs text-gray-500">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {Number(plan.targetCarbs) || 0}g
              </div>
              <div className="text-xs text-gray-500">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                {Number(plan.targetFats) || 0}g
              </div>
              <div className="text-xs text-gray-500">Fats</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {planDuration > 1 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{daysCompleted} of {planDuration} days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>Created {formatDate(plan.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="capitalize">{planDifficulty.toLowerCase()}</span>
          </div>
        </div>

        {/* Tags */}
        {planTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {planTags.slice(0, 3).map((tag, index) => (
              <span 
                key={`tag-${index}-${tag}`}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md break-all"
              >
                {String(tag)}
              </span>
            ))}
            {planTags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                +{planTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleViewPlan}
            disabled={!planId}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4 flex-shrink-0" />
            <span>View Plan</span>
          </button>
          
          {planIsActive && planId && (
            <button
              onClick={handleStartPlan}
              className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Start Plan"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-6 right-14">
        {planIsActive ? (
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
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}
    </div>
  );
}