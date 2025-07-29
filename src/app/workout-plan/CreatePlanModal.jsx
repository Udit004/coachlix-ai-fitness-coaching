"use client";
import React, { useState } from "react";
import { X, Plus, Minus, Dumbbell, Target, Clock, Users } from "lucide-react";

export default function CreatePlanModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    difficulty: "Beginner",
    duration: 8,
    workoutFrequency: 3,
    targetMuscleGroups: [],
    equipment: [],
    tags: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const goals = [
    "Strength Building",
    "Weight Loss",
    "Muscle Gain", 
    "Endurance",
    "General Fitness",
    "Athletic Performance",
    "Rehabilitation"
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  const muscleGroups = [
    "Chest", "Back", "Shoulders", "Arms", "Legs", 
    "Core", "Glutes", "Calves", "Forearms", "Full Body"
  ];

  const equipmentOptions = [
    "Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight",
    "Resistance Band", "Kettlebell", "Medicine Ball", "TRX", "Cardio Equipment"
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleArrayToggle = (array, item, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: array.includes(item)
        ? array.filter(i => i !== item)
        : [...array, item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Plan name is required");
      return;
    }
    if (!formData.goal) {
      setError("Please select a goal");
      return;
    }
    if (formData.duration < 1 || formData.duration > 52) {
      setError("Duration must be between 1 and 52 weeks");
      return;
    }
    if (formData.workoutFrequency < 1 || formData.workoutFrequency > 7) {
      setError("Workout frequency must be between 1 and 7 days per week");
      return;
    }

    setLoading(true);
    try {
      // Generate initial week structure based on duration and frequency
      const weeks = [];
      for (let weekNum = 1; weekNum <= formData.duration; weekNum++) {
        const days = [];
        for (let dayNum = 1; dayNum <= 7; dayNum++) {
          const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayNum - 1];
          days.push({
            dayNumber: dayNum,
            dayName,
            isRestDay: dayNum > formData.workoutFrequency, // First N days are workout days
            workouts: dayNum <= formData.workoutFrequency ? [{
              name: `${dayName} Workout`,
              type: 'Strength',
              exercises: [],
              estimatedDuration: 60,
              intensity: 'Moderate'
            }] : [],
            totalDuration: 0,
            totalCaloriesBurned: 0
          });
        }
        weeks.push({
          weekNumber: weekNum,
          days,
          weeklyGoal: `Week ${weekNum} - Build momentum`,
          completed: false,
          totalWorkouts: 0,
          totalDuration: 0
        });
      }

      const planData = {
        ...formData,
        weeks,
        startDate: new Date().toISOString(),
        currentWeek: 1,
        isActive: true,
        stats: {
          totalWorkouts: 0,
          totalDuration: 0,
          totalCalories: 0,
          averageWorkoutDuration: 0,
          completionRate: 0,
          strongestLifts: []
        }
      };

      await onCreate(planData);
    } catch (err) {
      setError(err.message || "Failed to create workout plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Workout Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Full Body Strength Program"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe your workout plan..."
              />
            </div>
          </div>

          {/* Goal and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fitness Goal *
              </label>
              <select
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a goal</option>
                {goals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (weeks) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="52"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                1-52 weeks
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Workout Frequency (per week) *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="workoutFrequency"
                  value={formData.workoutFrequency}
                  onChange={handleInputChange}
                  min="1"
                  max="7"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                1-7 days per week
              </p>
            </div>
          </div>

          {/* Target Muscle Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Target Muscle Groups
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {muscleGroups.map((muscle) => (
                <label
                  key={muscle}
                  className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.targetMuscleGroups.includes(muscle)}
                    onChange={() =>
                      handleArrayToggle(formData.targetMuscleGroups, muscle, "targetMuscleGroups")
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {muscle}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Equipment Available
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {equipmentOptions.map((equipment) => (
                <label
                  key={equipment}
                  className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.equipment.includes(equipment)}
                    onChange={() =>
                      handleArrayToggle(formData.equipment, equipment, "equipment")
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {equipment}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              ) : (
                "Create Plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}