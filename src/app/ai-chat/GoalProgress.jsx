import React from 'react';
import { Trophy } from 'lucide-react';

const GoalProgress = ({ userProfile }) => {
  const getGoalData = () => {
    const baseGoal = {
      title: 'Weekly Goal',
      percentage: 75,
      dayProgress: 'Day 5 of 7',
      motivationText: 'Keep going!'
    };

    if (userProfile?.fitnessGoal === 'weight-loss') {
      return {
        ...baseGoal,
        title: 'Weight Loss Goal',
        percentage: 60,
        dayProgress: 'Week 3 of 12',
        motivationText: 'You\'re doing great!'
      };
    } else if (userProfile?.fitnessGoal === 'muscle-gain') {
      return {
        ...baseGoal,
        title: 'Muscle Gain Goal',
        percentage: 80,
        dayProgress: 'Week 4 of 8',
        motivationText: 'Gains are coming!'
      };
    } else if (userProfile?.fitnessGoal === 'badminton') {
      return {
        ...baseGoal,
        title: 'Badminton Improvement',
        percentage: 70,
        dayProgress: 'Session 14 of 20',
        motivationText: 'Your game is improving!'
      };
    }

    return baseGoal;
  };

  const goalData = getGoalData();

  if (!userProfile?.fitnessGoal) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
        Goal Progress
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{goalData.title}</span>
          <span className="text-sm font-medium text-green-600">{goalData.percentage}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${goalData.percentage}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{goalData.dayProgress}</span>
          <span>{goalData.motivationText}</span>
        </div>
      </div>
    </div>
  );
};

export default GoalProgress;