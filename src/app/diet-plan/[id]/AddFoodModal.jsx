// components/AddFoodModal.jsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Plus, Clock, Star } from "lucide-react";
import dietPlanService from "@/service/dietPlanService";

export default function AddFoodModal({ isOpen, onClose, onAdd, mealType }) {
  const [activeTab, setActiveTab] = useState("manual"); // 'manual' or 'search'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [foodDetails, setFoodDetails] = useState(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    quantity: "1 serving",
    notes: "",
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        quantity: "1 serving",
        notes: "",
      });
      setSearchQuery("");
      setSearchResults([]);
      setIsSubmitting(false);
      setAiLoading(false);
      setFoodDetails(null);
      setShowAiSuggestion(false);
      fetchPopularFoods();
    }
  }, [isOpen]);

  const fetchPopularFoods = async () => {
    try {
      setLoadingPopular(true);
      const foods = await dietPlanService.getPopularFoods();
      setPopularFoods(foods.slice(0, 10)); // Limit to 10 items
    } catch (error) {
      console.error("Error fetching popular foods:", error);
    } finally {
      setLoadingPopular(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await dietPlanService.searchFoods(searchQuery.trim());

      // Handle different response formats
      let results = [];
      if (Array.isArray(response)) {
        results = response;
      } else if (response && Array.isArray(response.results)) {
        results = response.results;
      } else if (response && response.data && Array.isArray(response.data)) {
        results = response.data;
      }

      setSearchResults(results.slice(0, 20)); // Limit results
    } catch (error) {
      console.error("Error searching foods:", error);
      alert("Failed to search foods. Please try again.");
      setSearchResults([]); // Clear results on error
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectFood = (food) => {
    setFormData({
      name: food.name || food.description || "",
      calories: food.calories || food.energy || "",
      protein: food.protein || "",
      carbs: food.carbohydrates || food.carbs || "",
      fats: food.fat || food.fats || "",
      quantity: food.serving_size || "100g",
      notes: "",
    });
    setActiveTab("manual");
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (isSubmitting) return; // Prevent double submission

      // Validate required fields
      if (!formData.name.trim()) {
        alert("Food name is required");
        return;
      }

      if (!formData.calories || parseFloat(formData.calories) < 0) {
        alert("Please enter valid calories");
        return;
      }

      setIsSubmitting(true);

      try {
        const foodData = {
          name: formData.name.trim(),
          calories: parseFloat(formData.calories) || 0,
          protein: parseFloat(formData.protein) || 0,
          carbs: parseFloat(formData.carbs) || 0,
          fats: parseFloat(formData.fats) || 0,
          quantity: formData.quantity.trim() || "1 serving",
          notes: formData.notes.trim(),
        };

        await onAdd(foodData);
      } catch (error) {
        console.error("Error in handleSubmit:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onAdd, isSubmitting]
  );

  const handleClose = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!isSubmitting) {
        onClose();
      }
    },
    [onClose, isSubmitting]
  );

  const handleBackdropClick = useCallback(
    (e) => {
      // Only close if clicking directly on the backdrop, not on any child elements
      if (e.target === e.currentTarget && !isSubmitting) {
        console.log("Backdrop clicked, closing modal");
        handleClose();
      }
    },
    [handleClose, isSubmitting]
  );

  if (!isOpen) {
    console.log("Modal not open, returning null");
    return null;
  }

  console.log("Rendering AddFoodModal, isOpen:", isOpen);

  const getFoodDetailsWithAI = async (foodName) => {
    if (!foodName.trim()) return;

    try {
      setAiLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/foods/popular", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "get_details",
          foodName: foodName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.food) {
        setFoodDetails(data.food);
        setShowAiSuggestion(true);
      } else {
        setFoodDetails(null);
        setShowAiSuggestion(false);
      }
    } catch (error) {
      console.error("Error getting AI food details:", error);
      setFoodDetails(null);
      setShowAiSuggestion(false);
    } finally {
      setAiLoading(false);
    }
  };

  // Add this function to apply AI suggestions
  const applyAiSuggestion = () => {
    if (foodDetails) {
      setFormData({
        name: foodDetails.name,
        calories: foodDetails.calories.toString(),
        protein: foodDetails.protein.toString(),
        carbs: foodDetails.carbohydrates.toString(),
        fats: foodDetails.fat.toString(),
        quantity: foodDetails.serving_size || "100g",
        notes: foodDetails.preparation_tips || "",
      });
      setShowAiSuggestion(false);
    }
  };

  // Replace the return statement with this improved version:

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-hidden pt-16 sm:pt-0">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal Container - Mobile First Design */}
      <div className="relative bg-white dark:bg-gray-800 w-full h-[calc(100vh-4rem)] sm:h-auto sm:max-h-[85vh] sm:w-[95vw] sm:max-w-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden mx-2 sm:mx-0 sm:my-4">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              Add Food to {mealType}
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
            <button
              onClick={() => setActiveTab("manual")}
              disabled={isSubmitting}
              className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                activeTab === "manual"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("search")}
              disabled={isSubmitting}
              className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                activeTab === "search"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Search Foods
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-3 sm:px-6 py-3 sm:py-4 pb-20 sm:pb-4">
            {activeTab === "manual" ? (
              /* Manual Entry Form */
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Food Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Food Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setShowAiSuggestion(false);
                        setFoodDetails(null);
                      }}
                      onBlur={() => {
                        if (formData.name.trim() && !foodDetails) {
                          getFoodDetailsWithAI(formData.name);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 sm:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      placeholder="e.g., Grilled Chicken Breast"
                      required
                    />
                    {aiLoading && (
                      <div className="absolute right-3 top-2.5 sm:top-3">
                        <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {/* AI Suggestion Card - Mobile Optimized */}
                  {showAiSuggestion && foodDetails && (
                    <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                          AI Nutritional Information Found
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs mb-2 sm:mb-3">
                        <div className="text-center p-1.5 sm:p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                            {foodDetails.calories} cal
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            Calories
                          </div>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <div className="font-semibold text-red-600 dark:text-red-400 text-xs sm:text-sm">
                            {foodDetails.protein}g
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            Protein
                          </div>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <div className="font-semibold text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm">
                            {foodDetails.carbohydrates}g
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            Carbs
                          </div>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <div className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                            {foodDetails.fat}g
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            Fat
                          </div>
                        </div>
                      </div>

                      {foodDetails.description && (
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <strong>About:</strong> {foodDetails.description}
                        </p>
                      )}

                      {foodDetails.health_benefits && (
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                          <strong>Benefits:</strong>{" "}
                          {foodDetails.health_benefits}
                        </p>
                      )}

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={applyAiSuggestion}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 font-medium"
                        >
                          Use This Information
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAiSuggestion(false)}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Quantity/Serving Size
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    disabled={isSubmitting}
                      className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                    placeholder="e.g., 150g, 1 cup, 2 pieces"
                  />
                </div>

                {/* Nutrition Grid - Mobile Optimized */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Calories *
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) =>
                        setFormData({ ...formData, calories: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 250"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={formData.protein}
                      onChange={(e) =>
                        setFormData({ ...formData, protein: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={formData.carbs}
                      onChange={(e) =>
                        setFormData({ ...formData, carbs: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Fats (g)
                    </label>
                    <input
                      type="number"
                      value={formData.fats}
                      onChange={(e) =>
                        setFormData({ ...formData, fats: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50 text-sm sm:text-base"
                    rows={3}
                    maxLength={200}
                    placeholder="Any additional notes about preparation, brand, etc."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.notes.length}/200 characters
                  </p>
                </div>
              </form>
            ) : (
              /* Search Tab - Mobile Optimized */
              <div className="space-y-4 sm:space-y-6">
                {/* Search Input */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      disabled={isSubmitting}
                      className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      placeholder="Search foods..."
                    />
                    <Search className="absolute left-2.5 sm:left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={
                      isSearching || !searchQuery.trim() || isSubmitting
                    }
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </div>

                <div>
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                          Search Results ({searchResults.length})
                        </h4>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        {searchResults.map((food, index) => (
                          <div
                            key={index}
                            onClick={() =>
                              !isSubmitting && handleSelectFood(food)
                            }
                            className={`p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                              isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {food.name || food.description}
                                </h5>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {food.serving_size || "100g"} •{" "}
                                    {food.calories || food.energy} cal
                                  </p>
                                  {food.category && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                      {food.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 text-xs">
                                {food.protein > 0 && (
                                  <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">
                                    P: {Math.round(food.protein)}g
                                  </span>
                                )}
                                {(food.carbohydrates || food.carbs) > 0 && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs">
                                    C:{" "}
                                    {Math.round(
                                      food.carbohydrates || food.carbs
                                    )}
                                    g
                                  </span>
                                )}
                                {(food.fat || food.fats) > 0 && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
                                    F: {Math.round(food.fat || food.fats)}g
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Foods Section - Only show when no search results */}
                  {searchResults.length === 0 && !searchQuery && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                          Popular Foods
                        </h4>
                      </div>

                      {loadingPopular ? (
                        <div className="space-y-2 sm:space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse bg-gray-200 dark:bg-gray-700 h-14 sm:h-16 rounded-lg"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {popularFoods.map((food, index) => (
                            <div
                              key={index}
                              onClick={() =>
                                !isSubmitting && handleSelectFood(food)
                              }
                              className={`p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                isSubmitting
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                  <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                    {food.name || food.description}
                                  </h5>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {food.serving_size || "100g"} •{" "}
                                    {food.calories || food.energy} cal
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 text-xs">
                                  {food.protein > 0 && (
                                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">
                                      P: {Math.round(food.protein)}g
                                    </span>
                                  )}
                                  {(food.carbohydrates || food.carbs) > 0 && (
                                    <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs">
                                      C:{" "}
                                      {Math.round(
                                        food.carbohydrates || food.carbs
                                      )}
                                      g
                                    </span>
                                  )}
                                  {(food.fat || food.fats) > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
                                      F: {Math.round(food.fat || food.fats)}g
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Results Message */}
                  {searchQuery &&
                    searchResults.length === 0 &&
                    !isSearching && (
                      <div className="text-center py-6 sm:py-8">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                          <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                          No foods found for "{searchQuery}". Try a different
                          search term.
                        </p>
                      </div>
                    )}

                  {/* Loading State */}
                  {isSearching && (
                    <div className="text-center py-6 sm:py-8">
                      <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2 sm:mb-3"></div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Searching for foods...
                      </p>
                    </div>
                  )}
                </div>

                {/* Popular Foods Section */}
                {searchResults.length === 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Popular Foods
                      </h4>
                    </div>

                    {loadingPopular ? (
                      <div className="space-y-2 sm:space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse bg-gray-200 dark:bg-gray-700 h-14 sm:h-16 rounded-lg"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {popularFoods.map((food, index) => (
                          <div
                            key={index}
                            onClick={() =>
                              !isSubmitting && handleSelectFood(food)
                            }
                            className={`p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                              isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {food.name || food.description}
                                </h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  {food.serving_size || "100g"} •{" "}
                                  {food.calories || food.energy} cal
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 text-xs">
                                {food.protein > 0 && (
                                  <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">
                                    P: {Math.round(food.protein)}g
                                  </span>
                                )}
                                {(food.carbohydrates || food.carbs) > 0 && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs">
                                    C:{" "}
                                    {Math.round(
                                      food.carbohydrates || food.carbs
                                    )}
                                    g
                                  </span>
                                )}
                                {(food.fat || food.fats) > 0 && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
                                    F: {Math.round(food.fat || food.fats)}g
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* No Results Message */}
                {searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      No foods found for "{searchQuery}". Try a different search
                      term.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons - Mobile Optimized */}
        {activeTab === "manual" && (
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
              >
                {isSubmitting ? "Adding..." : "Add Food"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
