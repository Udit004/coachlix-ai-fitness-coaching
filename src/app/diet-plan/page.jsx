"use client"
import React, { useState } from 'react'
import MealSection from '../dietComponents/MealSection'
import RefreshPlanButton from '../dietComponents/RefreshPlanButton'
import AddItemForm from '../dietComponents/AddItemForm'
import { Plus } from 'lucide-react'

/**
 * Main Diet Plan page component
 * @returns {JSX.Element}
 */
export default function DietPlanPage() {
  // TODO: Connect to context/state management for diet plan data
  const [dietPlan, setDietPlan] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  })
  
  const [showAddForm, setShowAddForm] = useState(false)

  // TODO: Implement CRUD operations
  const addItem = (mealType, item) => {
    setDietPlan(prev => ({
      ...prev,
      [mealType]: [...prev[mealType], { ...item, id: Date.now() }]
    }))
  }

  const updateItem = (mealType, itemId, updatedItem) => {
    setDietPlan(prev => ({
      ...prev,
      [mealType]: prev[mealType].map(item => 
        item.id === itemId ? { ...updatedItem, id: itemId } : item
      )
    }))
  }

  const deleteItem = (mealType, itemId) => {
    setDietPlan(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter(item => item.id !== itemId)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Diet Plan</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
            <RefreshPlanButton />
          </div>
        </div>

        {/* Add Item Form Modal */}
        {showAddForm && (
          <AddItemForm
            onClose={() => setShowAddForm(false)}
            onAdd={addItem}
          />
        )}

        {/* Meal Sections */}
        <div className="space-y-6">
          <MealSection 
            title="Breakfast" 
            items={dietPlan.breakfast} 
            onUpdate={(itemId, updatedItem) => updateItem('breakfast', itemId, updatedItem)}
            onDelete={(itemId) => deleteItem('breakfast', itemId)}
          />
          <MealSection 
            title="Lunch" 
            items={dietPlan.lunch} 
            onUpdate={(itemId, updatedItem) => updateItem('lunch', itemId, updatedItem)}
            onDelete={(itemId) => deleteItem('lunch', itemId)}
          />
          <MealSection 
            title="Dinner" 
            items={dietPlan.dinner} 
            onUpdate={(itemId, updatedItem) => updateItem('dinner', itemId, updatedItem)}
            onDelete={(itemId) => deleteItem('dinner', itemId)}
          />
          <MealSection 
            title="Snacks" 
            items={dietPlan.snacks} 
            onUpdate={(itemId, updatedItem) => updateItem('snacks', itemId, updatedItem)}
            onDelete={(itemId) => deleteItem('snacks', itemId)}
          />
        </div>
      </div>
    </div>
  )
}