"use client"
import React, { useState } from 'react'
import { X } from 'lucide-react'

/**
 * Add item form component
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the form
 * @param {Function} props.onAdd - Function to add new item
 * @returns {JSX.Element}
 */
export default function AddItemForm({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    calories: '',
    macros: {
      carbs: '',
      protein: '',
      fat: ''
    },
    note: '',
    mealType: 'breakfast'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!form.name || !form.calories) {
      alert('Please fill in name and calories')
      return
    }

    // Create new item
    const newItem = {
      name: form.name,
      calories: parseInt(form.calories) || 0,
      macros: {
        carbs: parseInt(form.macros.carbs) || 0,
        protein: parseInt(form.macros.protein) || 0,
        fat: parseInt(form.macros.fat) || 0
      },
      note: form.note
    }

    // Add item and close form
    onAdd(form.mealType, newItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add Diet Item</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Grilled Chicken"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meal Type *
            </label>
            <select
              value={form.mealType}
              onChange={(e) => setForm(prev => ({ ...prev, mealType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calories *
            </label>
            <input
              type="number"
              value={form.calories}
              onChange={(e) => setForm(prev => ({ ...prev, calories: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 250"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Macronutrients (grams)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={form.macros.carbs}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  macros: { ...prev.macros, carbs: e.target.value }
                }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Carbs"
              />
              <input
                type="number"
                value={form.macros.protein}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  macros: { ...prev.macros, protein: e.target.value }
                }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Protein"
              />
              <input
                type="number"
                value={form.macros.fat}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  macros: { ...prev.macros, fat: e.target.value }
                }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fat"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Any additional notes..."
              rows="2"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}