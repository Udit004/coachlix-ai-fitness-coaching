// components/DietDayCard.jsx
"use client"
import React, { useState } from 'react';
import { Plus, Droplets, FileText, TrendingUp } from 'lucide-react';
import MealCard from './MealCard';
import dietPlanService from '@/service/dietPlanService';

export default function DietDayCard({ day, planId, onUpdate }) {
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [newMealType, setNewMealType] = useState('');
  const [waterIntake, setWaterIntake] = useState(day.waterIntake || 0);
  const [dayNotes, setDayNotes] = useState(day.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-Workout', 'Post-Workout'];
  const availableMealTypes = mealTypes.filter(type => 
    !day.meals.some(meal => meal.type === type)
  );

  const handleAddMeal = async () => {
    if (!newMealType) return;
    
    try {
      const mealData = {
        type: newMealType,
        items: []
      };
      
      await dietPlanService.addMeal(planId, day.dayNumber, mealData);
      setIsAddingMeal(false);
      setNewMealType('');
      onUpdate?.();
    } catch (err) {
      console.error('Error adding meal:', err);
      alert('Failed to add meal. Please try again.');
    }
  };

  const handleUpdateWater = async (newWaterIntake) => {
    try {
      const dayData = {
        ...day,
        waterIntake: newWaterIntake
      };
      
      await dietPlanService.updateDay(planId, day.dayNumber, dayData);
      setWaterIntake(newWaterIntake);
      onUpdate?.();
    } catch (err) {
      console.error('Error updating water intake:', err);
    }
  };

  const handleUpdateNotes = async () => {
    try {
      const dayData = {
        ...day,
        notes: dayNotes
      };
      
      await dietPlanService.updateDay(planId, day.dayNumber, dayData);
      setIsEditingNotes(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error updating notes:', err);
      alert('Failed to update notes. Please try again.');
    }
  };

  const macroPercentages = {
    protein: day.totalCalories > 0 ? Math.round((day.totalProtein * 4 / day.totalCalories) * 100) : 0,
    carbs: day.totalCalories > 0 ? Math.round((day.totalCarbs * 4 / day.totalCalories) * 100) : 0,
    fats: day.totalCalories > 0 ? Math.round((day.totalFats * 9 / day.totalCalories) * 100) : 0
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Day {day.dayNumber}
          </h2>
          <div className="flex items-center space-x-4 text-white">
            <div className="text-center">
              <p className="text-2xl font-bold">{day.totalCalories}</p>
              <p className="text-xs opacity-90">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{day.meals.length}</p>
              <p className="text-xs opacity-90">Meals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Macros */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Daily Macros
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-red-100 dark:bg-red-900 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {day.totalProtein}g
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Protein ({macroPercentages.protein}%)
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-3">
                  <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                    {day.totalCarbs}g
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Carbs ({macroPercentages.carbs}%)
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {day.totalFats}g
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Fats ({macroPercentages.fats}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Water Intake */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Water Intake
            </h3>
            <div className="bg-cyan-100 dark:bg-cyan-900 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <Droplets className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mr-1" />
                <input
                  type="number"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(parseFloat(e.target.value) || 0)}
                  onBlur={() => handleUpdateWater(waterIntake)}
                  className="w-16 text-center bg-transparent text-cyan-700 dark:text-cyan-300 font-bold text-lg border-none focus:outline-none"
                  step="0.1"
                  min="0"
                />
                <span className="text-cyan-600 dark:text-cyan-400 text-sm">L</span>
              </div>
              <p className="text-xs text-cyan-600 dark:text-cyan-400">Water</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meals Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Meals ({day.meals.length})
          </h3>
          
          {availableMealTypes.length > 0 && (
            <div className="flex items-center space-x-2">
              {isAddingMeal ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={newMealType}
                    onChange={(e) => setNewMealType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select meal type</option>
                    {availableMealTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMeal}
                    disabled={!newMealType}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingMeal(false);
                      setNewMealType('');
                    }}
                    className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingMeal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Meal</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Meals Grid */}
        {day.meals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {day.meals.map((meal, mealIndex) => (
              <MealCard
                key={`${meal.type}-${mealIndex}`}
                meal={meal}
                planId={planId}
                dayNumber={day.dayNumber}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No meals planned yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first meal to start planning this day
            </p>
            {availableMealTypes.length > 0 && !isAddingMeal && (
              <button
                onClick={() => setIsAddingMeal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Meal</span>
              </button>
            )}
          </div>
        )}

        {/* Day Notes */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Day Notes
            </h4>
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm"
              >
                Edit
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleUpdateNotes}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingNotes(false);
                    setDayNotes(day.notes || '');
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          {isEditingNotes ? (
            <textarea
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
              placeholder="Add notes for this day (meal timing, supplements, energy levels, etc.)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={4}
              maxLength={500}
            />
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[100px]">
              {dayNotes ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {dayNotes}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No notes added yet. Click Edit to add notes about this day.
                </p>
              )}
            </div>
          )}
          
          {isEditingNotes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {dayNotes.length}/500 characters
            </p>
          )}
        </div>
      </div>
    </div>
  );
}