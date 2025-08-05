"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Dumbbell,
  Target,
  Clock,
  Users,
  Calendar,
  Save,
} from "lucide-react";

export default function EditPlanModal({ plan, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    difficulty: "Beginner",
    duration: 8,
    workoutFrequency: 3,
    selectedDays: [],
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
    "Rehabilitation",
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  const muscleGroups = [
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Legs",
    "Core",
    "Glutes",
    "Calves",
    "Forearms",
    "Full Body",
  ];

  const equipmentOptions = [
    "Barbell",
    "Dumbbell",
    "Machine",
    "Cable",
    "Bodyweight",
    "Resistance Band",
    "Kettlebell",
    "Medicine Ball",
    "TRX",
    "Cardio Equipment",
  ];

  const daysOfWeek = [
    { value: 1, name: "Monday", short: "Mon" },
    { value: 2, name: "Tuesday", short: "Tue" },
    { value: 3, name: "Wednesday", short: "Wed" },
    { value: 4, name: "Thursday", short: "Thu" },
    { value: 5, name: "Friday", short: "Fri" },
    { value: 6, name: "Saturday", short: "Sat" },
    { value: 7, name: "Sunday", short: "Sun" },
  ];

  // Initialize form data with existing plan data
  useEffect(() => {
    if (plan && plan._id) {
      // Add plan._id check to ensure plan is fully loaded
      console.log("Plan data:", plan); // Debug log

      // Extract selected days from existing weeks structure - improved logic
      let selectedDays = [];

      // First, try to get from plan.selectedDays if it exists
      if (Array.isArray(plan.selectedDays) && plan.selectedDays.length > 0) {
        selectedDays = [...plan.selectedDays];
      }
      // Otherwise, extract from weeks structure by checking for actual workouts
      else if (plan.weeks && plan.weeks.length > 0) {
        const workoutDaysSet = new Set();

        plan.weeks.forEach((week) => {
          if (week.days) {
            week.days.forEach((day) => {
              // Check if day has workouts AND is not a rest day
              if (!day.isRestDay && day.workouts && day.workouts.length > 0) {
                workoutDaysSet.add(day.dayNumber);
              }
            });
          }
        });

        selectedDays = Array.from(workoutDaysSet).sort((a, b) => a - b);
      }

      console.log("Extracted selected days:", selectedDays); // Debug log
      console.log("Setting form data with selected days:", selectedDays); // Additional debug

      setFormData((prevData) => ({
        name: plan.name || "",
        description: plan.description || "",
        goal: plan.goal || "",
        difficulty: plan.difficulty || "Beginner",
        duration: plan.duration || 8,
        workoutFrequency: plan.workoutFrequency || selectedDays.length || 3,
        selectedDays: selectedDays,
        targetMuscleGroups: Array.isArray(plan.targetMuscleGroups)
          ? plan.targetMuscleGroups
          : [],
        equipment: Array.isArray(plan.equipment) ? plan.equipment : [],
        tags: Array.isArray(plan.tags) ? plan.tags : [],
      }));
    }
  }, [plan?._id]); // Change dependency to plan._id to avoid multiple triggers

  // Debug useEffect to track formData changes
  useEffect(() => {
    console.log("FormData updated:", formData);
    console.log("Selected days in formData:", formData.selectedDays);
  }, [formData.selectedDays]);

  // Update selected days when workout frequency changes
  useEffect(() => {
    // Only run this effect if we have initial data and the frequency actually changed
    if (
      formData.selectedDays.length > 0 &&
      formData.workoutFrequency !== formData.selectedDays.length
    ) {
      console.log("Adjusting selected days due to frequency change");

      // If frequency is reduced, keep the first N selected days
      if (formData.workoutFrequency < formData.selectedDays.length) {
        setFormData((prev) => ({
          ...prev,
          selectedDays: prev.selectedDays.slice(0, formData.workoutFrequency),
        }));
      }
      // If frequency is increased and we have fewer selected days, auto-select additional days
      else if (
        formData.workoutFrequency > formData.selectedDays.length &&
        formData.selectedDays.length === 0
      ) {
        // Auto-select first N days only if no days are currently selected
        const autoSelectedDays = daysOfWeek
          .slice(0, formData.workoutFrequency)
          .map((day) => day.value);
        setFormData((prev) => ({
          ...prev,
          selectedDays: autoSelectedDays,
        }));
      }
    }
  }, [formData.workoutFrequency]); // Remove formData.selectedDays.length from dependencies

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleArrayToggle = (array, item, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: array.includes(item)
        ? array.filter((i) => i !== item)
        : [...array, item],
    }));
  };

  const handleDayToggle = (dayValue) => {
    const isSelected = formData.selectedDays.includes(dayValue);

    if (isSelected) {
      // Remove day
      setFormData((prev) => ({
        ...prev,
        selectedDays: prev.selectedDays.filter((day) => day !== dayValue),
      }));
    } else {
      // Add day only if we haven't reached the frequency limit
      if (formData.selectedDays.length < formData.workoutFrequency) {
        setFormData((prev) => ({
          ...prev,
          selectedDays: [...prev.selectedDays, dayValue].sort((a, b) => a - b),
        }));
      }
    }
  };

  const updateWeeksStructure = (planData, newSelectedDays, newDuration) => {
    const weeks = [];

    for (let weekNum = 1; weekNum <= newDuration; weekNum++) {
      const existingWeek = planData.weeks?.find(
        (w) => w.weekNumber === weekNum
      );
      const days = [];

      for (let dayNum = 1; dayNum <= 7; dayNum++) {
        const dayName = daysOfWeek[dayNum - 1].name;
        const isWorkoutDay = newSelectedDays.includes(dayNum);
        const existingDay = existingWeek?.days?.find(
          (d) => d.dayNumber === dayNum
        );

        if (isWorkoutDay) {
          // This should be a workout day
          if (
            existingDay &&
            !existingDay.isRestDay &&
            existingDay.workouts?.length > 0
          ) {
            // Keep existing workout data
            days.push({
              ...existingDay,
              isRestDay: false,
            });
          } else {
            // Create new workout day
            days.push({
              dayNumber: dayNum,
              dayName,
              isRestDay: false,
              workouts: [
                {
                  name: `${dayName} Workout`,
                  type: "Strength",
                  exercises: [],
                  estimatedDuration: 60,
                  intensity: "Moderate",
                },
              ],
              totalDuration: 0,
              totalCaloriesBurned: 0,
            });
          }
        } else {
          // This should be a rest day
          days.push({
            dayNumber: dayNum,
            dayName,
            isRestDay: true,
            workouts: [],
            totalDuration: 0,
            totalCaloriesBurned: 0,
          });
        }
      }

      weeks.push({
        weekNumber: weekNum,
        days,
        weeklyGoal:
          existingWeek?.weeklyGoal || `Week ${weekNum} - Build momentum`,
        completed: existingWeek?.completed || false,
        totalWorkouts: existingWeek?.totalWorkouts || 0,
        totalDuration: existingWeek?.totalDuration || 0,
      });
    }

    return weeks;
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
    if (formData.selectedDays.length !== formData.workoutFrequency) {
      setError(
        `Please select exactly ${formData.workoutFrequency} workout days`
      );
      return;
    }

    setLoading(true);
    try {
      // Update the weeks structure if days or duration changed
      const updatedWeeks = updateWeeksStructure(
        plan,
        formData.selectedDays,
        formData.duration
      );

      const updateData = {
        name: formData.name,
        description: formData.description,
        goal: formData.goal,
        difficulty: formData.difficulty,
        duration: formData.duration,
        workoutFrequency: formData.workoutFrequency,
        selectedDays: formData.selectedDays,
        targetMuscleGroups: formData.targetMuscleGroups,
        equipment: formData.equipment,
        tags: formData.tags,
        weeks: updatedWeeks,
        updatedAt: new Date().toISOString(),
      };

      await onUpdate(plan._id, updateData);
    } catch (err) {
      setError(err.message || "Failed to update workout plan");
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Save className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Workout Plan
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                1-7 days per week
              </p>
            </div>
          </div>

          {/* Workout Days Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Workout Days *
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Choose {formData.workoutFrequency} day
                  {formData.workoutFrequency !== 1 ? "s" : ""} for your workouts
                  {formData.selectedDays.length > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      ({formData.selectedDays.length}/
                      {formData.workoutFrequency} selected)
                    </span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = formData.selectedDays.includes(day.value);
                  const canSelect =
                    !isSelected &&
                    formData.selectedDays.length < formData.workoutFrequency;
                  const isDisabled = !isSelected && !canSelect;

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      disabled={isDisabled}
                      className={`
                        p-3 rounded-lg text-center transition-all duration-200 border-2
                        ${
                          isSelected
                            ? "bg-green-600 text-white border-green-600 shadow-lg"
                            : isDisabled
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                        }
                      `}
                    >
                      <div className="text-xs font-medium">{day.short}</div>
                      <div className="text-xs mt-1">{day.name.slice(0, 3)}</div>
                    </button>
                  );
                })}
              </div>
              {formData.selectedDays.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Selected days:{" "}
                  {formData.selectedDays
                    .map(
                      (dayNum) =>
                        daysOfWeek.find((d) => d.value === dayNum)?.name
                    )
                    .join(", ")}
                </div>
              )}
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
                      handleArrayToggle(
                        formData.targetMuscleGroups,
                        muscle,
                        "targetMuscleGroups"
                      )
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
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
                      handleArrayToggle(
                        formData.equipment,
                        equipment,
                        "equipment"
                      )
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {equipment}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Warning about data changes */}
          {(() => {
            // Get original selected days for comparison
            let originalSelectedDays = [];
            if (
              Array.isArray(plan.selectedDays) &&
              plan.selectedDays.length > 0
            ) {
              originalSelectedDays = [...plan.selectedDays].sort(
                (a, b) => a - b
              );
            } else if (plan.weeks && plan.weeks.length > 0) {
              const workoutDaysSet = new Set();
              plan.weeks.forEach((week) => {
                if (week.days) {
                  week.days.forEach((day) => {
                    // Check if day has workouts AND is not a rest day
                    if (
                      !day.isRestDay &&
                      day.workouts &&
                      day.workouts.length > 0
                    ) {
                      workoutDaysSet.add(day.dayNumber);
                    }
                  });
                }
              });
              originalSelectedDays = Array.from(workoutDaysSet).sort(
                (a, b) => a - b
              );
            }

            const daysChanged =
              JSON.stringify(formData.selectedDays) !==
              JSON.stringify(originalSelectedDays);
            const durationChanged = formData.duration !== plan.duration;

            return (
              (daysChanged || durationChanged) && (
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <strong>Notice:</strong> Changing the duration or workout
                    days will update your plan structure. Existing workouts will
                    be preserved where possible, but some data may be
                    reorganized.
                  </p>
                </div>
              )
            );
          })()}

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
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
