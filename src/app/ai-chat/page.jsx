// page.jsx - Fixed version without React Query dependency
"use client";
import React, { useState, useRef, useEffect } from "react";
import useUserProfileStore from "@/stores/useUserProfileStore";
import useChatStore from "@/stores/useChatStore";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import {
  Activity,
  Dumbbell,
  Heart,
  Trophy,
  Target,
  Zap,
  Apple,
  Calendar,
  Plus,
  History
} from "lucide-react";
import { useAuthContext } from "../../auth/AuthContext";

// Import all components
import ChatHeader from "./ChatHeader";
import ChatSidebar from "./ChatSidebar";
import ChatContainer from "./ChatContainer";
import ErrorBanner from "./ErrorBanner";
import ChatHistory from "./ChatHistory";
import { useChatHistory } from "@/hooks/useChatHistory";

const AIChatPage = () => {
  const { user: authUser, loading: authLoading } = useAuthContext();
  
  // Zustand stores
  const {
    messages,
    currentChatId,
    selectedPlan,
    isNewChat,
    isTyping,
    sidebarOpen,
    showHistory,
    inputValue,
    error,
    // Actions
    setMessages,
    addMessage,
    updateLastMessage,
    setCurrentChatId,
    setSelectedPlan,
    setIsNewChat,
    setIsTyping,
    setSidebarOpen,
    setShowHistory,
    setInputValue,
    setError,
    clearError,
    startNewChat,
    loadChat,
    generateChatTitle
  } = useChatStore();

  // User profile state
  const {
    profile: userProfile,
    loading: profileLoading,
    error: profileError,
    fetchUserProfile,
    hasValidProfile,
    clearError: clearProfileError,
  } = useUserProfileStore();

  // Chat history hook (local implementation, not React Query)
  const {
    chatHistory,
    loading: historyLoading,
    error: historyError,
    saveChat,
    updateChat,
    deleteChat,
    generateChatTitle: generateTitle
  } = useChatHistory(authUser?.uid);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Recording state (separate from store for now)
  const [isRecording, setIsRecording] = useState(false);

  // Training plans configuration
  const plans = [
    {
      id: "general",
      name: "General Fitness",
      icon: Activity,
      color: "from-blue-500 to-purple-600",
    },
    {
      id: "badminton",
      name: "Badminton Player",
      icon: Target,
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "weight-loss",
      name: "Weight Loss",
      icon: Apple,
      color: "from-orange-500 to-red-600",
    },
    {
      id: "muscle-gain",
      name: "Muscle Building",
      icon: Dumbbell,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "strength",
      name: "Strength Training",
      icon: Dumbbell,
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "cardio",
      name: "Cardio Focus",
      icon: Heart,
      color: "from-red-500 to-pink-600",
    },
    {
      id: "sports",
      name: "Sports Training",
      icon: Trophy,
      color: "from-yellow-500 to-orange-600",
    },
    {
      id: "quick",
      name: "Quick Workouts",
      icon: Zap,
      color: "from-green-500 to-blue-600",
    },
  ];

  const quickActions = [
    {
      icon: Dumbbell,
      text: "Create a workout plan for me",
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
    },
    {
      icon: Apple,
      text: "Design a nutrition plan",
      color: "bg-gradient-to-r from-green-500 to-green-600",
    },
    {
      icon: Calendar,
      text: "Help me create a weekly schedule",
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
    },
    {
      icon: Target,
      text: "Set fitness goals with me",
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
    },
  ];

  // Fetch user profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;

      if (!authUser) {
        console.log("No authenticated user found");
        return;
      }

      if (profileError) {
        clearProfileError();
      }

      try {
        const userId = authUser.uid;

        if (hasValidProfile()) {
          console.log("📦 Using existing profile data from store");
          return;
        }

        await fetchUserProfile(userId, { maxAge: 5 * 60 * 1000 });
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setError("Failed to load your profile. Some features may not work properly.");
      }
    };

    loadProfile();
  }, [
    authUser,
    authLoading,
    fetchUserProfile,
    hasValidProfile,
    profileError,
    clearProfileError,
    setError
  ]);

  // Handle sending messages with local axios call
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
      plan: selectedPlan,
    };

    // Add user message
    addMessage(userMessage);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);
    setError(null);

    try {
      // Send message using axios
      const response = await axios.post("/api/chat", {
        message: currentInput,
        plan: selectedPlan,
        conversationHistory: messages,
        profile: userProfile,
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to get AI response");
      }

      const aiResponse = {
        id: Date.now() + 1,
        role: "ai",
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
      };

      addMessage(aiResponse);

      // Auto-save chat after AI response
      if (authUser?.uid) {
        const updatedMessages = [...messages, userMessage, aiResponse];
        
        if (isNewChat && updatedMessages.length >= 2) {
          // Save new chat after first exchange
          const title = generateChatTitle(updatedMessages);
          const chatId = await saveChat(title, selectedPlan, updatedMessages);
          if (chatId) {
            setCurrentChatId(chatId);
            setIsNewChat(false);
          }
        } else if (currentChatId) {
          // Update existing chat
          await updateChat(currentChatId, updatedMessages);
        }
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setError(error.message);

      const errorMessage = {
        id: Date.now() + 1,
        role: "ai",
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
        suggestions: ["Try again", "Check connection", "Refresh page"],
        isError: true,
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle selecting a chat from history
  const handleSelectChat = (chat) => {
    loadChat(chat);
    toast.success("Chat loaded successfully");
  };

  // Handle starting new chat
  const handleNewChat = () => {
    startNewChat();
    
    // Initialize with welcome message after profile loads
    if (userProfile && !profileLoading) {
      const welcomeMessage = {
        id: Date.now(),
        role: "ai",
        content: `Welcome back, ${
          userProfile.name
        }! 🎯 I'm your AI fitness coach, ready to help you achieve your ${userProfile.fitnessGoal?.replace(
          "-",
          " "
        )} goals.\n\nI can help you with:\n• Personalized workout plans\n• Nutrition guidance\n• Progress tracking\n• Motivation and support\n\nWhat would you like to work on today?`,
        timestamp: new Date(),
        suggestions: [
          `Create a ${userProfile.fitnessGoal?.replace("-", " ")} plan`,
          "Track my progress",
          "Get nutrition advice",
          "Set weekly goals",
        ],
      };
      setMessages([welcomeMessage]);
    }
  };

  // Handle deleting a chat
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        handleNewChat(); // Start new chat if current chat was deleted
      }
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle recording (placeholder for voice input)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success("Voice recording started");
    } else {
      toast.success("Voice recording stopped");
    }
  };

  // Utility functions
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const clearChat = () => {
    if (messages.length > 1) {
      handleNewChat();
      toast.success("Started new chat");
    }
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
    if (messages.length === 0 && userProfile && !profileLoading && isNewChat) {
      const welcomeMessage = {
        id: Date.now(),
        role: "ai",
        content: `Welcome back, ${
          userProfile.name
        }! 🎯 I'm your AI fitness coach, ready to help you achieve your ${userProfile.fitnessGoal?.replace(
          "-",
          " "
        )} goals.\n\nI can help you with:\n• Personalized workout plans\n• Nutrition guidance\n• Progress tracking\n• Motivation and support\n\nWhat would you like to work on today?`,
        timestamp: new Date(),
        suggestions: [
          `Create a ${userProfile.fitnessGoal?.replace("-", " ")} plan`,
          "Track my progress",
          "Get nutrition advice",
          "Set weekly goals",
        ],
      };
      setMessages([welcomeMessage]);
    }
  }, [userProfile, profileLoading, isNewChat, messages.length, setMessages]);

  const combinedError = error || profileError || historyError;

  // Show loading state
  const isLoading = authLoading || profileLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          {/* AI Avatar with pulsing effect */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            {/* Pulsing rings */}
            <div className="absolute inset-0 w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
              <div
                className="absolute inset-2 bg-purple-400 rounded-full animate-ping opacity-30"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
          </div>

          {/* Thinking dots animation */}
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-full px-4 py-3 shadow-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>

          {/* Dynamic loading text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">
              Waking up your AI trainer...
            </h3>
            <p className="text-gray-600 text-sm animate-pulse">
              Preparing personalized fitness insights
            </p>
          </div>

          {/* Subtle progress indication */}
          <div className="mt-8 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
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
            background: "#1f2937",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
      
      {/* Error Banner */}
      <ErrorBanner
        error={combinedError}
        onClose={() => {
          setError(null);
          clearProfileError();
        }}
      />
      
      {/* Chat Header with New Chat and History buttons */}
      <ChatHeader
        plans={plans}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        clearChat={clearChat}
        userProfile={userProfile}
        // Add new props for history
        onNewChat={handleNewChat}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
        isNewChat={isNewChat}
      />
      
      {/* Main Chat Layout - Mobile Optimized */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-6 h-full">
          <div className="flex gap-2 sm:gap-6 h-full">
            
            {/* History Sidebar - Show when showHistory is true */}
            {showHistory && (
              <div className="w-80 flex-shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <History className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-800">Chat History</h3>
                    </div>
                    <button
                      onClick={handleNewChat}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New</span>
                    </button>
                  </div>
                </div>
                <ChatHistory
                  chatHistory={chatHistory}
                  loading={historyLoading}
                  onSelectChat={handleSelectChat}
                  onDeleteChat={handleDeleteChat}
                  currentChatId={currentChatId}
                  plans={plans}
                />
              </div>
            )}

            {/* Main Sidebar - Show when sidebarOpen is true */}
            <div
              className={`${
                sidebarOpen
                  ? "fixed inset-0 z-50 bg-white lg:relative lg:inset-auto lg:bg-transparent"
                  : "hidden lg:block"
              } w-full lg:w-80 flex-shrink-0 overflow-y-auto h-full p-4 lg:p-0`}
            >
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
                // Add chat context
                currentChatId={currentChatId}
                isNewChat={isNewChat}
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