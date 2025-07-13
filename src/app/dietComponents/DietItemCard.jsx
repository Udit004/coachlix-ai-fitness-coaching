"use client"
import React, { useState } from 'react'
import { Edit, Trash2, Save, X } from 'lucide-react'

/**
 * Diet item card component
 * @param {Object} props
 * @param {Object} props.item - Diet item object
 * @param {string} props.item.name - Item name
 * @param {number} props.item.calories - Calories count
 * @param {Object} props.item.macros - Macronutrients object
 * @param {number} props.item.macros.carbs - Carbs in grams
 * @param {number} props.item.macros.protein - Protein in grams
 * @param {number} props.item.macros.fat - Fat in grams
 * @param {string} [props.item.note] - Optional note
 * @param {Function} props.onUpdate - Function to update item
 * @param {Function} props.onDelete - Function to delete item
 * @returns {JSX.Element}
 */
export default function DietItemCard({ item, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: item.name,
    calories: item.calories,
    macros: { ...item.macros },
    note: item.note || ''
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate(item.id, editForm)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm({
      name: item.name,
      calories: item.calories,
      macros: { ...item.macros },
      note: item.note || ''
    })
    setIsEditing(false)
  }

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      onDelete(item.id)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="space-y-3">
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Item name"
          />
          
          <input
            type="number"
            value={editForm.calories}
            onChange={(e) => setEditForm(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Calories"
          />
          
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={editForm.macros.carbs}
              onChange={(e) => setEditForm(prev => ({ 
                ...prev, 
                macros: { ...prev.macros, carbs: parseInt(e.target.value) || 0 }
              }))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Carbs"
            />
            <input
              type="number"
              value={editForm.macros.protein}
              onChange={(e) => setEditForm(prev => ({ 
                ...prev, 
                macros: { ...prev.macros, protein: parseInt(e.target.value) || 0 }
              }))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Protein"
            />
            <input
              type="number"
              value={editForm.macros.fat}
              onChange={(e) => setEditForm(prev => ({ 
                ...prev, 
                macros: { ...prev.macros, fat: parseInt(e.target.value) || 0 }
              }))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Fat"
            />
          </div>
          
          <textarea
            value={editForm.note}
            onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Optional note"
            rows="2"
          />
          
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSave}
              className="p-2 text-green-500 hover:text-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">{item.name}</h3>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <span className="text-2xl font-bold text-gray-900">{item.calories}</span>
        <span className="text-sm text-gray-500 ml-1">calories</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{item.macros.carbs}g</div>
          <div className="text-xs text-gray-500">Carbs</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{item.macros.protein}g</div>
          <div className="text-xs text-gray-500">Protein</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{item.macros.fat}g</div>
          <div className="text-xs text-gray-500">Fat</div>
        </div>
      </div>
      
      {item.note && (
        <p className="text-sm text-gray-600 italic">{item.note}</p>
      )}
    </div>
  )
}