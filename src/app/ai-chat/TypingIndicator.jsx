import React from 'react';
import { Bot, Sparkles } from './icons';

const TypingIndicator = ({ userProfile }) => {
  const getTypingMessage = () => {
    const messages = [
      "Analyzing your fitness data...",
      "Crafting personalized advice...",
      "Checking your progress...",
      "Preparing recommendations...",
      "Thinking about your goals..."
    ];
    
    if (userProfile?.fitnessGoal === 'weight-loss') {
      return "Calculating calorie recommendations...";
    } else if (userProfile?.fitnessGoal === 'muscle-gain') {
      return "Designing muscle-building strategies...";
    } else if (userProfile?.fitnessGoal === 'badminton') {
      return "Analyzing your badminton technique...";
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="flex justify-start px-2 sm:px-0">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm max-w-xs sm:max-w-sm">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex space-x-1 sm:space-x-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            </div>
            <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{getTypingMessage()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;