// components/MealCard.jsx
"use client"
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Utensils, Calculator } from 'lucide-react';
import FoodItemCard from './FoodItemCard';
import AddFoodModal from './AddFoodModal';
import dietPlanService from '@/service/dietPlanService';

export default function MealCard({ meal, planId, dayNumber, onUpdate }) {
  const [isAddingFood, setIsAddingFood] = useState(false);

  // Calculate meal totals
  const mealTotals = meal.items.reduce(
    (totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein: totals.protein + (item.protein || 0),
      carbs: totals.carbs + (item.carbs || 0),
      fats: totals.fats + (item.fats || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleAddFood = async (foodData) => {
    try {
      await dietPlanService.addFoodItem(planId, dayNumber, meal.type, foodData);
      setIsAddingFood(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error adding food item:', error);
      alert('Failed to add food item. Please try again.');
    }
  };

  const handleUpdateFood = async (itemIndex, foodData) => {
    try {
      await dietPlanService.updateFoodItem(planId, dayNumber, meal.type, itemIndex, foodData);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating food item:', error);
      alert('Failed to update food item. Please try again.');
    }
  };

  const handleDeleteFood = async (itemIndex) => {
    if (!confirm('Are you sure you want to remove this food item?')) return;
    
    try {
      await dietPlanService.deleteFoodItem(planId, dayNumber, meal.type, itemIndex);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting food item:', error);
      alert('Failed to delete food item. Please try again.');
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      'Breakfast': '🌅',
      'Lunch': '☀️',
      'Dinner': '🌙',
      'Snacks': '🍎',
      'Pre-Workout': '💪',
      'Post-Workout': '🥤'
    };
    return icons[mealType] || '🍽️';
  };

  const getMealColor = (mealType) => {
    const colors = {
      'Breakfast': 'from-orange-500 to-yellow-500',
      'Lunch': 'from-blue-500 to-cyan-500',
      'Dinner': 'from-purple-500 to-indigo-500',
      'Snacks': 'from-green-500 to-emerald-500',
      'Pre-Workout': 'from-red-500 to-pink-500',
      'Post-Workout': 'from-teal-500 to-cyan-500'
    };
    return colors[mealType] || 'from-gray-500 to-gray-600';
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {/* Meal Header */}
        <div className={`bg-gradient-to-r ${getMealColor(meal.type)} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getMealIcon(meal.type)}</span>
              <h3 className="text-lg font-semibold text-white">
                {meal.type}
              </h3>
              <span className="text-white/80 text-sm">
                ({meal.items.length} items)
              </span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">
                {Math.round(mealTotals.calories)}
              </p>
              <p className="text-xs text-white/80">calories</p>
            </div>
          </div>
        </div>

        {/* Meal Summary */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {Math.round(mealTotals.protein)}g
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Protein</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                {Math.round(mealTotals.carbs)}g
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Carbs</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(mealTotals.fats)}g
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Fats</p>
            </div>
          </div>
        </div>

        {/* Food Items */}
        <div className="p-4">
          {meal.items.length > 0 ? (
            <div className="space-y-3 mb-4">
              {meal.items.map((item, index) => (
                <FoodItemCard
                  key={index}
                  item={item}
                  itemIndex={index}
                  onUpdate={(foodData) => handleUpdateFood(index, foodData)}
                  onDelete={() => handleDeleteFood(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                <Utensils className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                No food items added yet
              </p>
            </div>
          )}

          {/* Add Food Button */}
          <button
            onClick={() => setIsAddingFood(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddingFood}
        onClose={() => setIsAddingFood(false)}
        onAdd={handleAddFood}
        mealType={meal.type}
      />
    </>
  );
}