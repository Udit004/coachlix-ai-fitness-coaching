// components/FoodItemCard.jsx
"use client"
import React, { useState } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';

export default function FoodItemCard({ item, itemIndex, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: item.name || '',
    calories: item.calories || 0,
    protein: item.protein || 0,
    carbs: item.carbs || 0,
    fats: item.fats || 0,
    quantity: item.quantity || '1 serving',
    notes: item.notes || ''
  });

  const handleSave = () => {
    // Validate required fields
    if (!editData.name.trim()) {
      alert('Food name is required');
      return;
    }
    
    if (editData.calories < 0) {
      alert('Calories cannot be negative');
      return;
    }

    onUpdate({
      ...editData,
      name: editData.name.trim(),
      calories: parseFloat(editData.calories) || 0,
      protein: parseFloat(editData.protein) || 0,
      carbs: parseFloat(editData.carbs) || 0,
      fats: parseFloat(editData.fats) || 0,
      quantity: editData.quantity.trim() || '1 serving',
      notes: editData.notes.trim()
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: item.name || '',
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fats: item.fats || 0,
      quantity: item.quantity || '1 serving',
      notes: item.notes || ''
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Food Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Food Name *
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="e.g., Grilled Chicken Breast"
              required
            />
          </div>

          {/* Quantity */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity/Serving Size
            </label>
            <input
              type="text"
              value={editData.quantity}
              onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="e.g., 150g, 1 cup, 2 pieces"
            />
          </div>

          {/* Macros */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Calories *
            </label>
            <input
              type="number"
              value={editData.calories}
              onChange={(e) => setEditData({ ...editData, calories: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              min="0"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Protein (g)
            </label>
            <input
              type="number"
              value={editData.protein}
              onChange={(e) => setEditData({ ...editData, protein: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Carbs (g)
            </label>
            <input
              type="number"
              value={editData.carbs}
              onChange={(e) => setEditData({ ...editData, carbs: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fats (g)
            </label>
            <input
              type="number"
              value={editData.fats}
              onChange={(e) => setEditData({ ...editData, fats: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              min="0"
              step="0.1"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
              rows={2}
              maxLength={200}
              placeholder="Any additional notes about preparation, brand, etc."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {editData.notes.length}/200 characters
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 group hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Food Name & Quantity */}
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {item.name}
            </h4>
            {item.quantity && item.quantity !== '1 serving' && (
              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full shrink-0">
                {item.quantity}
              </span>
            )}
          </div>

          {/* Macros */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.round(item.calories || 0)}
              </span>
              <span className="text-gray-600 dark:text-gray-400">cal</span>
            </div>
            
            {(item.protein > 0 || item.carbs > 0 || item.fats > 0) && (
              <>
                <div className="text-gray-400">•</div>
                <div className="flex items-center space-x-2 text-xs">
                  {item.protein > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      P: {Math.round(item.protein)}g
                    </span>
                  )}
                  {item.carbs > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      C: {Math.round(item.carbs)}g
                    </span>
                  )}
                  {item.fats > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                      F: {Math.round(item.fats)}g
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
              {item.notes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
            title="Edit food item"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Delete food item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}