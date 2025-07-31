// components/MealCard.jsx
"use client";
import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Plus, Edit, Trash2, Utensils, Calculator } from "lucide-react";
import FoodItemCard from "./FoodItemCard";
import dietPlanService from "@/service/dietPlanService";

export default function MealCard({ meal, planId, dayNumber, onUpdate }) {
  const AddFoodModal = dynamic(() => import("./AddFoodModal"), {
    loading: () => (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="w-[90%] max-w-xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-6"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false, // Optional: disable server-side rendering
  });
  const [isAddingFood, setIsAddingFood] = useState(false);
  const isProcessingRef = useRef(false);

  // Calculate meal totals
  const mealTotals = meal.items.reduce(
    (totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein: totals.protein + (item.protein || 0),
      carbs: totals.carbs + (item.carbs || 0),
      fats: totals.fats + (item.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleAddFood = useCallback(
    async (foodData) => {
      try {
        await dietPlanService.addFoodItem(
          planId,
          dayNumber,
          meal.type,
          foodData
        );
        // Use setTimeout to ensure state is set after modal operations complete
        setTimeout(() => {
          setIsAddingFood(false);
        }, 0);
        onUpdate?.();
      } catch (error) {
        console.error("Error adding food item:", error);
        alert("Failed to add food item. Please try again.");
        setIsAddingFood(false);
      }
    },
    [planId, dayNumber, meal.type, onUpdate]
  );

  const handleUpdateFood = async (itemIndex, foodData) => {
    try {
      await dietPlanService.updateFoodItem(
        planId,
        dayNumber,
        meal.type,
        itemIndex,
        foodData
      );
      onUpdate?.();
    } catch (error) {
      console.error("Error updating food item:", error);
      alert("Failed to update food item. Please try again.");
    }
  };

  const handleDeleteFood = async (itemIndex) => {
    if (!confirm("Are you sure you want to remove this food item?")) return;

    try {
      await dietPlanService.deleteFoodItem(
        planId,
        dayNumber,
        meal.type,
        itemIndex
      );
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting food item:", error);
      alert("Failed to delete food item. Please try again.");
    }
  };

  const handleOpenModal = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessingRef.current) {
      console.log("Already processing, ignoring click");
      return;
    }

    console.log("Opening modal");
    isProcessingRef.current = true;

    setIsAddingFood((prev) => {
      if (prev === true) {
        console.log("Modal already open, ignoring");
        return prev;
      }
      console.log("Setting isAddingFood from", prev, "to true");
      return true;
    });

    // Reset the processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log("Closing modal");
    isProcessingRef.current = false; // Reset processing flag
    setIsAddingFood((prev) => {
      console.log("Setting isAddingFood from", prev, "to false");
      return false;
    });
  }, []);

  const getMealIcon = (mealType) => {
    const icons = {
      Breakfast: "🌅",
      Lunch: "☀️",
      Dinner: "🌙",
      Snacks: "🍎",
      "Pre-Workout": "💪",
      "Post-Workout": "🥤",
    };
    return icons[mealType] || "🍽️";
  };

  const getMealColor = (mealType) => {
    const colors = {
      Breakfast: "from-orange-500 to-yellow-500",
      Lunch: "from-blue-500 to-cyan-500",
      Dinner: "from-purple-500 to-indigo-500",
      Snacks: "from-green-500 to-emerald-500",
      "Pre-Workout": "from-red-500 to-pink-500",
      "Post-Workout": "from-teal-500 to-cyan-500",
    };
    return colors[mealType] || "from-gray-500 to-gray-600";
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {/* Meal Header */}
        <div
          className={`bg-gradient-to-r ${getMealColor(meal.type)} px-4 py-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getMealIcon(meal.type)}</span>
              <h3 className="text-lg font-semibold text-white">{meal.type}</h3>
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
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Protein
              </p>
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
            onClick={handleOpenModal}
            disabled={isAddingFood}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Add Food Modal */}
      {isAddingFood && (
        <AddFoodModal
          key="add-food-modal"
          isOpen={true}
          onClose={handleCloseModal}
          onAdd={handleAddFood}
          mealType={meal.type}
        />
      )}
    </>
  );
}
