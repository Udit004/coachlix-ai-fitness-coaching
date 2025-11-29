// components/LoadingStates/EnhancedLoading.jsx - Simplified & Responsive
import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Sparkles,
  Calendar,
  Apple,
  Target
} from './icons';

const LoadingMessages = [
  "Setting up your AI coach...",
  "Loading your profile...",
  "Almost ready..."
];

const EnhancedLoading = ({ stage = 'initial', progress = 0, message = '' }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Faster message cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LoadingMessages.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Faster progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const displayProgress = progress || currentProgress;
  const displayMessage = message || LoadingMessages[currentMessageIndex];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
      {/* Left Sidebar - Hidden on mobile, visible on md+ */}
      <div className="hidden md:flex md:w-72 lg:w-80 bg-gray-800/50 border-r border-gray-700 p-4 lg:p-6 flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="h-2.5 lg:h-3 bg-gray-700 rounded w-28 lg:w-32 mb-1.5"></div>
              <div className="h-2 bg-gray-700/50 rounded w-20 lg:w-24"></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-3 mb-4 border-b border-gray-700 pb-2">
          <div className="flex items-center space-x-1.5 text-blue-400 border-b-2 border-blue-400 pb-2">
            <div className="w-3 h-3 bg-blue-500/20 rounded"></div>
            <span className="text-xs lg:text-sm font-medium">Dashboard</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <div className="w-3 h-3 bg-gray-700 rounded"></div>
            <span className="text-xs lg:text-sm">History</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-gray-800/80 rounded-lg lg:rounded-xl p-3 lg:p-4 mb-4 border border-gray-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base lg:text-lg">U</span>
            </div>
            <div className="flex-1">
              <div className="h-2.5 bg-gray-700 rounded w-24 mb-1.5"></div>
              <div className="h-2 bg-gray-700/50 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex-1">
          <h3 className="text-gray-400 text-xs lg:text-sm font-medium mb-2">Quick Actions</h3>
          <div className="space-y-1.5">
            {[
              { icon: Dumbbell, text: "Create workout plan" },
              { icon: Apple, text: "Design nutrition plan" },
              { icon: Calendar, text: "Weekly schedule" },
              { icon: Target, text: "Set fitness goals" }
            ].map((action, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <action.icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs lg:text-sm text-gray-300">{action.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area - Full width on mobile, flex-1 on desktop */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="text-center max-w-sm">
          {/* Loading Animation */}
          <div className="relative mb-6 md:mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" style={{ animationDuration: '1.2s' }} />
            </div>
            <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-blue-500/20 animate-ping" style={{ animationDuration: '1.2s' }}></div>
          </div>

          {/* Loading Message */}
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            {displayMessage}
          </h2>
          
          {/* Progress Bar */}
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Loading</span>
              <span className="text-xs text-gray-400">{Math.round(displayProgress)}%</span>
            </div>
            <div className="w-full max-w-xs md:max-w-md h-1.5 bg-gray-700 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-150"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-gray-400 text-xs md:text-sm flex items-center justify-center space-x-2">
            <Sparkles className="w-3 h-3" />
            <span>Powered by Gemini AI</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Different loading states
export const ProfileLoading = () => (
  <EnhancedLoading 
    stage="profile" 
    message="Loading your fitness profile..." 
    progress={25}
  />
);

export const ChatLoading = () => (
  <EnhancedLoading 
    stage="chat" 
    message="Preparing your AI coach..." 
    progress={50}
  />
);

export const ThinkingLoading = () => (
  <EnhancedLoading 
    stage="thinking" 
    message="AI is thinking..." 
    progress={75}
  />
);

export const InitializingLoading = () => (
  <EnhancedLoading 
    stage="initial" 
    message="Initializing AI Fitness Coach..." 
    progress={10}
  />
);

export default EnhancedLoading;
