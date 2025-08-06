// components/LoadingStates/EnhancedLoading.jsx
import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Activity, 
  Heart, 
  Target, 
  Zap,
  Brain,
  Sparkles
} from 'lucide-react';

const LoadingMessages = [
  "Waking up your AI trainer...",
  "Analyzing your fitness profile...",
  "Preparing personalized insights...",
  "Loading your workout data...",
  "Setting up your dashboard...",
  "Almost ready to start training..."
];

const LoadingSubtexts = [
  "Crafting the perfect fitness experience",
  "Tailoring workouts to your goals", 
  "Optimizing your training plan",
  "Syncing your progress data",
  "Preparing smart recommendations",
  "Getting everything ready..."
];

const FloatingIcon = ({ Icon, delay, position }) => (
  <div 
    className={`absolute ${position} animate-bounce opacity-30`}
    style={{ animationDelay: `${delay}ms`, animationDuration: '2s' }}
  >
    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
      <Icon className="w-4 h-4 text-white" />
    </div>
  </div>
);

const PulseRing = ({ delay, size = "w-20 h-20" }) => (
  <div 
    className={`absolute inset-0 ${size} mx-auto rounded-full border-2 border-white/30 animate-ping`}
    style={{ animationDelay: `${delay}ms`, animationDuration: '2s' }}
  />
);

const ProgressBar = ({ progress }) => (
  <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-white/60 to-white/90 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const ThinkingDots = () => (
  <div className="flex justify-center items-center space-x-1">
    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
    <div 
      className="w-2 h-2 bg-white/60 rounded-full animate-bounce" 
      style={{ animationDelay: '0.1s' }}
    />
    <div 
      className="w-2 h-2 bg-white/60 rounded-full animate-bounce" 
      style={{ animationDelay: '0.2s' }}
    />
  </div>
);

const EnhancedLoading = ({ stage = 'initial', progress = 0, message = '' }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Cycle through loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LoadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const displayProgress = progress || currentProgress;
  const displayMessage = message || LoadingMessages[currentMessageIndex];
  const displaySubtext = LoadingSubtexts[currentMessageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full mix-blend-overlay animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full mix-blend-overlay animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-white rounded-full mix-blend-overlay animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-white rounded-full mix-blend-overlay animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Floating Icons */}
      <FloatingIcon Icon={Activity} delay={0} position="top-1/4 left-1/4" />
      <FloatingIcon Icon={Heart} delay={500} position="top-1/3 right-1/4" />
      <FloatingIcon Icon={Target} delay={1000} position="bottom-1/3 left-1/3" />
      <FloatingIcon Icon={Zap} delay={1500} position="bottom-1/4 right-1/3" />

      <div className="text-center max-w-md mx-auto relative z-10">
        {/* Main AI Avatar with Enhanced Animations */}
        <div className="relative mb-8">
          {/* Pulse Rings */}
          <PulseRing delay={0} />
          <PulseRing delay={500} size="w-24 h-24" />
          <PulseRing delay={1000} size="w-28 h-28" />
          
          {/* Main Avatar */}
          <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden">
              {stage === 'thinking' ? (
                <Brain className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Dumbbell className="w-8 h-8 text-white" />
              )}
              
              {/* Sparkle Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Floating Sparkles */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -left-2">
            <Sparkles className="w-3 h-3 text-pink-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Enhanced Thinking Animation */}
        <div className="flex justify-center items-center mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-white/20">
            <ThinkingDots />
          </div>
        </div>

        {/* Dynamic Status Messages */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xl font-bold text-white transition-all duration-500 ease-in-out">
            {displayMessage}
          </h3>
          <p className="text-blue-100 text-sm animate-pulse transition-all duration-500">
            {displaySubtext}
          </p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-blue-100">Loading</span>
            <span className="text-xs text-blue-100">{Math.round(displayProgress)}%</span>
          </div>
          <ProgressBar progress={displayProgress} />
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 opacity-60">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <Target className="w-5 h-5 text-white mx-auto mb-1" />
            <p className="text-xs text-blue-100">Smart Goals</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <Activity className="w-5 h-5 text-white mx-auto mb-1" />
            <p className="text-xs text-blue-100">AI Workouts</p>
          </div>
        </div>

        {/* Loading Tips */}
        <div className="text-center">
          <p className="text-xs text-blue-200/80 italic">
            "Your AI trainer is getting smarter every day"
          </p>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
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