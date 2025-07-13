"use client"
import React, { useState, useRef, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import { 
  Activity, 
  Dumbbell, 
  Heart, 
  Trophy,
  Target,
  Zap,
  Apple,
  Calendar
} from 'lucide-react';
import { useAuthContext } from '../../auth/AuthContext';

// Import all components
import ChatHeader from './ChatHeader';
import ChatSidebar from './ChatSidebar';
import ChatContainer from './ChatContainer';
import ErrorBanner from './ErrorBanner';

const AIChatPage = () => {
  const { user: authUser, loading: authLoading } = useAuthContext();

  // State management
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('general');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // User profile state - fetch from backend
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Training plans configuration
  const plans = [
    { id: 'general', name: 'General Fitness', icon: Activity, color: 'from-blue-500 to-purple-600' },
    { id: 'badminton', name: 'Badminton Player', icon: Target, color: 'from-green-500 to-emerald-600' },
    { id: 'weight-loss', name: 'Weight Loss', icon: Apple, color: 'from-orange-500 to-red-600' },
    { id: 'muscle-gain', name: 'Muscle Building', icon: Dumbbell, color: 'from-purple-500 to-pink-600' },
    { id: 'strength', name: 'Strength Training', icon: Dumbbell, color: 'from-purple-500 to-indigo-600' },
    { id: 'cardio', name: 'Cardio Focus', icon: Heart, color: 'from-red-500 to-pink-600' },
    { id: 'sports', name: 'Sports Training', icon: Trophy, color: 'from-yellow-500 to-orange-600' },
    { id: 'quick', name: 'Quick Workouts', icon: Zap, color: 'from-green-500 to-blue-600' }
  ];

  const quickActions = [
    { icon: Dumbbell, text: "Create a workout plan for me", color: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { icon: Apple, text: "Design a nutrition plan", color: "bg-gradient-to-r from-green-500 to-green-600" },
    { icon: Calendar, text: "Help me create a weekly schedule", color: "bg-gradient-to-r from-orange-500 to-orange-600" },
    { icon: Target, text: "Set fitness goals with me", color: "bg-gradient-to-r from-purple-500 to-purple-600" }
  ];

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get auth token if available
        let token = null;
        if (authUser) {
          token = await authUser.getIdToken();
        }
        
        const res = await fetch('/api/userProfile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        const data = await res.json();
        if (data.success) {
          setUserProfile(data.data);
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchProfile();
    }
  }, [authUser, authLoading]);

  // Handle sending messages - Use your backend API
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      plan: selectedPlan
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      // Call your backend API instead of DeepSeek directly
      const response = await axios.post('/api/chat', {
        message: currentInput,
        plan: selectedPlan,
        conversationHistory: messages,
        profile: userProfile // Pass userProfile for personalization
      });
      
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
        suggestions: ["Try again", "Check connection", "Refresh page"],
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle recording (placeholder for voice input)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success('Voice recording started');
    } else {
      toast.success('Voice recording stopped');
    }
  };

  // Utility functions
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep only the initial message
    setError(null);
    toast.success('Chat cleared');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && userProfile) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Welcome back, ${userProfile.name}! 🎯 I'm your AI fitness coach, ready to help you achieve your ${userProfile.fitnessGoal?.replace('-', ' ')} goals.\n\nI can help you with:\n• Personalized workout plans\n• Nutrition guidance\n• Progress tracking\n• Motivation and support\n\nWhat would you like to work on today?`,
        timestamp: new Date(),
        suggestions: [
          `Create a ${userProfile.fitnessGoal?.replace('-', ' ')} plan`,
          'Track my progress',
          'Get nutrition advice',
          'Set weekly goals'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [userProfile]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px'
          }
        }}
      />
      
      {/* Error Banner */}
      <ErrorBanner 
        error={error} 
        onClose={() => setError(null)} 
      />

      {/* Chat Header */}
      <ChatHeader
        plans={plans}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        clearChat={clearChat}
        userProfile={userProfile}
      />

      {/* Main Chat Layout - Mobile Optimized */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-6 h-full">
          <div className="flex gap-2 sm:gap-6 h-full">
            {/* Sidebar - Mobile Overlay */}
            <div className={`${
              sidebarOpen 
                ? 'fixed inset-0 z-50 bg-white lg:relative lg:inset-auto lg:bg-transparent' 
                : 'hidden lg:block'
            } w-full lg:w-80 flex-shrink-0 overflow-y-auto h-full p-4 lg:p-0`}>
              <ChatSidebar
                plans={plans}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                handleSuggestionClick={handleSuggestionClick}
                userProfile={userProfile}
                quickActions={quickActions}
              />
            </div>

            {/* Chat Container - Mobile Optimized */}
            <div className="flex-1 h-full min-w-0">
              <ChatContainer
                messages={messages}
                isTyping={isTyping}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSendMessage={handleSendMessage}
                handleSuggestionClick={handleSuggestionClick}
                handleKeyPress={handleKeyPress}
                isRecording={isRecording}
                toggleRecording={toggleRecording}
                userProfile={userProfile}
                textareaRef={textareaRef}
                messagesEndRef={messagesEndRef}
                formatTime={formatTime}
                copyToClipboard={copyToClipboard}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AIChatPage;