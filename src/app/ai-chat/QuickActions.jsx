import React from 'react';
import { 
  Dumbbell, 
  Apple, 
  Calendar, 
  Target
} from './icons';

const QuickActions = ({ 
  userProfile, 
  handleSuggestionClick 
}) => {
  const getQuickActions = () => {
    const baseActions = [
      { icon: Dumbbell, text: "Create workout plan", color: "hover:bg-blue-50 hover:text-blue-600" },
      { icon: Apple, text: "Design nutrition plan", color: "hover:bg-green-50 hover:text-green-600" },
      { icon: Calendar, text: "Weekly schedule", color: "hover:bg-orange-50 hover:text-orange-600" },
      { icon: Target, text: "Set fitness goals", color: "hover:bg-purple-50 hover:text-purple-600" }
    ];
    
    if (userProfile?.fitnessGoal === 'weight-loss') {
      return [
        { icon: Target, text: "Track calories", color: "hover:bg-red-50 hover:text-red-600" },
        { icon: Dumbbell, text: "Cardio workout", color: "hover:bg-green-50 hover:text-green-600" },
        { icon: Apple, text: "Meal prep plan", color: "hover:bg-blue-50 hover:text-blue-600" },
        { icon: Calendar, text: "Weekly goals", color: "hover:bg-purple-50 hover:text-purple-600" }
      ];
    } else if (userProfile?.fitnessGoal === 'muscle-gain') {
      return [
        { icon: Dumbbell, text: "Strength training", color: "hover:bg-purple-50 hover:text-purple-600" },
        { icon: Apple, text: "Protein calculator", color: "hover:bg-green-50 hover:text-green-600" },
        { icon: Calendar, text: "Workout split", color: "hover:bg-blue-50 hover:text-blue-600" },
        { icon: Target, text: "Track progress", color: "hover:bg-orange-50 hover:text-orange-600" }
      ];
    } else if (userProfile?.fitnessGoal === 'badminton') {
      return [
        { icon: Target, text: "Improve technique", color: "hover:bg-purple-50 hover:text-purple-600" },
        { icon: Dumbbell, text: "Training plan", color: "hover:bg-green-50 hover:text-green-600" },
        { icon: Calendar, text: "Practice schedule", color: "hover:bg-blue-50 hover:text-blue-600" },
        { icon: Apple, text: "Sports nutrition", color: "hover:bg-orange-50 hover:text-orange-600" }
      ];
    }
    
    return baseActions;
  };

  return (
    <div className="bg-gray-800/80 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700 shadow-sm">
      <h3 className="font-medium text-white mb-2 sm:mb-3 text-sm sm:text-base">Quick Actions</h3>
      <div className="space-y-1.5 sm:space-y-2">
        {getQuickActions().map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleSuggestionClick(action.text)}
              className={`w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg text-gray-300 transition-all duration-200 bg-gray-700/50 hover:bg-gray-700 border border-gray-600`}
            >
              <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="font-medium text-xs sm:text-sm text-left">{action.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;