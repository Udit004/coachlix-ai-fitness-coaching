// components/AddFoodModal.jsx
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, Clock, Star } from 'lucide-react';
import dietPlanService from '@/service/dietPlanService';

export default function AddFoodModal({ isOpen, onClose, onAdd, mealType }) {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    quantity: '1 serving',
    notes: ''
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        quantity: '1 serving',
        notes: ''
      });
      setSearchQuery('');
      setSearchResults([]);
      setIsSubmitting(false);
      fetchPopularFoods();
    }
  }, [isOpen]);

  const fetchPopularFoods = async () => {
    try {
      setLoadingPopular(true);
      const foods = await dietPlanService.getPopularFoods();
      setPopularFoods(foods.slice(0, 10)); // Limit to 10 items
    } catch (error) {
      console.error('Error fetching popular foods:', error);
    } finally {
      setLoadingPopular(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await dietPlanService.searchFoods(searchQuery.trim());
      setSearchResults(results.slice(0, 20)); // Limit results
    } catch (error) {
      console.error('Error searching foods:', error);
      alert('Failed to search foods. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectFood = (food) => {
    setFormData({
      name: food.name || food.description || '',
      calories: food.calories || food.energy || '',
      protein: food.protein || '',
      carbs: food.carbohydrates || food.carbs || '',
      fats: food.fat || food.fats || '',
      quantity: food.serving_size || '100g',
      notes: ''
    });
    setActiveTab('manual');
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Food name is required');
      return;
    }
    
    if (!formData.calories || parseFloat(formData.calories) < 0) {
      alert('Please enter valid calories');
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
        quantity: formData.quantity.trim() || '1 serving',
        notes: formData.notes.trim()
      };

      await onAdd(foodData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onAdd, isSubmitting]);

  const handleClose = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isSubmitting) {
      onClose();
    }
  }, [onClose, isSubmitting]);

  const handleBackdropClick = useCallback((e) => {
    // Only close if clicking directly on the backdrop, not on any child elements
    if (e.target === e.currentTarget && !isSubmitting) {
      console.log('Backdrop clicked, closing modal');
      handleClose();
    }
  }, [handleClose, isSubmitting]);

  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Rendering AddFoodModal, isOpen:', isOpen);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleBackdropClick}
          style={{ zIndex: -1 }}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Food to {mealType}
              </h3>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('manual')}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setActiveTab('search')}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                  activeTab === 'search'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Search Foods
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 px-6 py-4">
            {activeTab === 'manual' ? (
              /* Manual Entry Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Food Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="e.g., Grilled Chicken Breast"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity/Serving Size
                    </label>
                    <input
                      type="text"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="e.g., 150g, 1 cup, 2 pieces"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Calories *
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 250"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={formData.carbs}
                      onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fats (g)
                    </label>
                    <input
                      type="number"
                      value={formData.fats}
                      onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50"
                      rows={3}
                      maxLength={200}
                      placeholder="Any additional notes about preparation, brand, etc."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.notes.length}/200 characters
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Food'}
                  </button>
                </div>
              </form>
            ) : (
              /* Search Tab */
              <div className="space-y-6">
                {/* Search Input */}
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="Search for foods (e.g., chicken breast, apple, rice)"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim() || isSubmitting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Popular Foods Section */}
                {searchResults.length === 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Popular Foods
                      </h4>
                    </div>
                    
                    {loadingPopular ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {popularFoods.map((food, index) => (
                          <div
                            key={index}
                            onClick={() => !isSubmitting && handleSelectFood(food)}
                            className={`p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {food.name || food.description}
                                </h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {food.serving_size || '100g'} • {food.calories || food.energy} cal
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 text-xs">
                                {food.protein > 0 && (
                                  <span className="text-red-600 dark:text-red-400">
                                    P: {Math.round(food.protein)}g
                                  </span>
                                )}
                                {(food.carbohydrates || food.carbs) > 0 && (
                                  <span className="text-yellow-600 dark:text-yellow-400">
                                    C: {Math.round(food.carbohydrates || food.carbs)}g
                                  </span>
                                )}
                                {(food.fat || food.fats) > 0 && (
                                  <span className="text-blue-600 dark:text-blue-400">
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

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Search Results ({searchResults.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((food, index) => (
                        <div
                          key={index}
                          onClick={() => !isSubmitting && handleSelectFood(food)}
                          className={`p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {food.name || food.description}
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {food.serving_size || '100g'} • {food.calories || food.energy} cal
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                              {food.protein > 0 && (
                                <span className="text-red-600 dark:text-red-400">
                                  P: {Math.round(food.protein)}g
                                </span>
                              )}
                              {(food.carbohydrates || food.carbs) > 0 && (
                                <span className="text-yellow-600 dark:text-yellow-400">
                                  C: {Math.round(food.carbohydrates || food.carbs)}g
                                </span>
                              )}
                              {(food.fat || food.fats) > 0 && (
                                <span className="text-blue-600 dark:text-blue-400">
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

                {/* No Results Message */}
                {searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      No foods found for "{searchQuery}". Try a different search term.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}