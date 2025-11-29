import React from 'react';
import { 
  Activity, 
  Clock, 
  Heart,
  Target
} from './icons';
import { Flame, Droplets, Moon } from 'lucide-react'; // Keep these from lucide as they're not commonly used

const ProgressStats = ({ userProfile }) => {
  const getPersonalizedStats = () => {
    const defaultStats = [
      { label: 'Calories Burned', value: '320 kcal', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Workout Time', value: '45 min', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Water Intake', value: '1.2L / 2.5L', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { label: 'Sleep Hours', value: '7.5 hrs', icon: Moon, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Heart Rate', value: '72 bpm', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' }
    ];

    // Personalize based on user profile
    if (userProfile?.fitnessGoal === 'weight-loss') {
      return [
        { label: 'Calories Burned', value: '450 kcal', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Steps Today', value: '8,540', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Water Intake', value: '1.8L / 3L', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' }
      ];
    } else if (userProfile?.fitnessGoal === 'muscle-gain') {
      return [
        { label: 'Protein Intake', value: '120g / 150g', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Workout Time', value: '60 min', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Recovery Time', value: '8 hrs', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
      ];
    } else if (userProfile?.fitnessGoal === 'badminton') {
      return [
        { label: 'Court Time', value: '90 min', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Rallies Won', value: '67%', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Stamina Level', value: '85%', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' }
      ];
    }
    
    return defaultStats.slice(0, 3);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2 text-green-600" />
        Today's Progress
      </h3>
      <div className="space-y-4">
        {getPersonalizedStats().map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`flex items-center justify-between p-3 ${stat.bg} rounded-lg`}>
              <div className="flex items-center space-x-2">
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
                <span className="text-gray-700 font-medium">{stat.label}</span>
              </div>
              <span className={`font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStats;