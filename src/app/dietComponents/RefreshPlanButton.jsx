// / /components/RefreshPlanButton.jsx
"use client"
import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Refresh plan button component
 * @returns {JSX.Element}
 */
export default function RefreshPlanButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement API call to /api/ai/diet/refresh
      const response = await fetch('/api/ai/diet/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to refresh diet plan')
      }
      
      // TODO: Handle successful response and update diet plan data
      const data = await response.json()
      console.log('Refreshed diet plan:', data)
      
    } catch (error) {
      console.error('Error refreshing diet plan:', error)
      // TODO: Show error notification to user
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      <span>{isLoading ? 'Refreshing...' : 'Refresh Plan'}</span>
    </button>
  )
}