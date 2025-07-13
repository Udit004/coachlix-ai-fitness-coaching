// /components/MealSection.jsx
"use client"
import React from 'react'
import CollapsibleSection from './CollapsibleSection'
import DietItemCard from './DietItemCard'

/**
 * Meal section component
 * @param {Object} props
 * @param {string} props.title - Meal title (e.g., "Breakfast")
 * @param {Array} props.items - Array of diet item objects
 * @param {Function} props.onUpdate - Function to update item
 * @param {Function} props.onDelete - Function to delete item
 * @returns {JSX.Element}
 */
export default function MealSection({ title, items, onUpdate, onDelete }) {
  return (
    <CollapsibleSection title={title}>
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No {title.toLowerCase()} added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <DietItemCard 
              key={item.id} 
              item={item} 
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}