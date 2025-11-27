// page.jsx - Enhanced version with improved loading and ChatHistory
"use client";
import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import useUserProfileStore from "@/stores/useUserProfileStore";
import useChatStore from "@/stores/useChatStore";
import useChatHistoryStore from "@/stores/useChatHistoryStore";
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
  History,
  AlertCircle,
} from "lucide-react";
import { useAuthContext } from "../../auth/AuthContext";

// Lazy loaded components for better performance
const ChatHeader = lazy(() => import("./ChatHeader"));
const ChatSidebar = lazy(() => import("./ChatSidebar"));
const ChatContainer = lazy(() => import("./ChatContainer"));
const ErrorBanner = lazy(() => import("./ErrorBanner"));

// Enhanced loading components
import EnhancedLoading, {
  ProfileLoading,
  ChatLoading,
  InitializingLoading,
} from "./EnhancedLoading";

// Loading fallbacks for lazy components
const ComponentLoading = ({ type = "default" }) => (
  <div className="animate-pulse">
    {type === "header" && (
      <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
    )}
    {type === "sidebar" && (
      <div className="w-80 h-full bg-gray-200 rounded-lg"></div>
    )}
    {type === "chat" && <div className="flex-1 bg-gray-200 rounded-lg"></div>}
    {type === "default" && <div className="h-32 bg-gray-200 rounded-lg"></div>}
  </div>
);

const AIChatPage = () => {
  const { user: authUser, loading: authLoading } = useAuthContext();

  // Local loading states for better UX
  const [initializingStage, setInitializingStage] = useState("initial");
  const [componentLoaded, setComponentLoaded] = useState({
    header: false,
    sidebar: false,
    chat: false,
  });

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
    generateChatTitle,
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

  // Chat history store
  const {
    saveChat: saveHistoryChat,
    updateChat: updateHistoryChat,
    fetchChats,
  } = useChatHistoryStore();

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

  // Enhanced loading sequence
  useEffect(() => {
    const initializeApp = async () => {
      if (authLoading) return;

      try {
        // Stage 1: Initial setup
        setInitializingStage("initializing");
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!authUser) {
          console.log("No authenticated user found");
          return;
        }

        // Stage 2: Profile loading
        setInitializingStage("profile");

        if (profileError) {
          clearProfileError();
        }

        const userId = authUser.uid;

        if (!hasValidProfile()) {
          await fetchUserProfile(userId, { maxAge: 5 * 60 * 1000 });
        }

        // Stage 3: Chat preparation
        setInitializingStage("chat");
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Stage 4: Finalization
        setInitializingStage("ready");
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setError(
          "Failed to load your profile. Some features may not work properly."
        );
        setInitializingStage("error");
      }
    };

    initializeApp();
  }, [
    authUser,
    authLoading,
    fetchUserProfile,
    hasValidProfile,
    profileError,
    clearProfileError,
    setError,
  ]);

  // Component loading handlers
  const handleComponentLoad = (componentName) => {
    setComponentLoaded((prev) => ({
      ...prev,
      [componentName]: true,
    }));
  };

  // Handle sending messages with streaming support
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

    // Create initial AI message for streaming
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      role: "ai",
      content: "",
      timestamp: new Date(),
      suggestions: [],
    };

    addMessage(aiMessage);

    try {
      // Use streaming API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          plan: selectedPlan,
          conversationHistory: messages,
          profile: userProfile,
          userId: authUser?.uid,
          streaming: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamingContent = "";
      let suggestions = [];

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'connection':
                  console.log('Connected to streaming chat');
                  break;
                  
                case 'word':
                  streamingContent += data.word;
                  // Update the message content in real-time
                  updateLastMessage({
                    ...aiMessage,
                    content: streamingContent,
                  });
                  break;
                  
                case 'complete':
                  // Finalize the message with full content and suggestions
                  const finalMessage = {
                    ...aiMessage,
                    content: data.fullResponse,
                    suggestions: data.suggestions || [],
                  };
                  updateLastMessage(finalMessage);
                  
                  // Auto-save chat
                  if (authUser?.uid) {
                    const updatedMessages = [...messages, userMessage, finalMessage];
                    
                    if (isNewChat && updatedMessages.length >= 2) {
                      const title = generateChatTitle(updatedMessages);
                      const chatId = await saveHistoryChat(
                        authUser.uid,
                        title,
                        selectedPlan,
                        updatedMessages
                      );
                      if (chatId) {
                        setCurrentChatId(chatId);
                        setIsNewChat(false);
                      }
                    } else if (currentChatId) {
                      await updateHistoryChat(currentChatId, updatedMessages);
                    }
                  }
                  break;
                  
                case 'error':
                  throw new Error(data.error);
                  
                default:
                  console.log('Unknown streaming data type:', data.type);
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error("Error sending message:", error);

      let errorMessage = error.message;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setError(errorMessage);

      // Update the AI message to show error
      const errorMessageContent = `I apologize, but I'm having trouble responding right now. ${errorMessage}`;
      updateLastMessage({
        ...aiMessage,
        content: errorMessageContent,
        suggestions: ["Try again", "Check connection", "Refresh page"],
        isError: true,
      });
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
        content: `Hi ${userProfile.name}! 👋 Ready to work on your ${userProfile.fitnessGoal?.replace("-", " ")} goals?`,
        timestamp: new Date(),
        suggestions: [
          `Create a ${userProfile.fitnessGoal?.replace("-", " ")} plan`,
          "Design a meal plan",
          "Track my progress",
          "Set weekly goals",
        ],
      };
      setMessages([welcomeMessage]);
    }
  };

  // Handle deleting a chat
  const handleDeleteChat = async (chatId) => {
    const deleteChat = useChatHistoryStore.getState().deleteChat;
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
        content: `Hi ${userProfile.name}! 👋`,
        timestamp: new Date(),
        suggestions: [
          `Create a ${userProfile.fitnessGoal?.replace("-", " ")} plan`,
          "Design a meal plan",
          "Track my progress",
          "Set weekly goals",
        ],
      };
      setMessages([welcomeMessage]);
    }
  }, [userProfile, profileLoading, isNewChat, messages.length, setMessages]);

  const combinedError = error || profileError;

  // Show different loading states based on initialization stage
  if (authLoading || initializingStage !== "ready") {
    switch (initializingStage) {
      case "initial":
      case "initializing":
        return <InitializingLoading />;
      case "profile":
        return <ProfileLoading />;
      case "chat":
        return <ChatLoading />;
      case "error":
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 mb-4">
                We're having trouble loading your AI trainer. Please try
                refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      default:
        return <EnhancedLoading stage={initializingStage} />;
    }
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

      {/* Error Banner with Suspense */}
      {combinedError && (
        <Suspense fallback={<ComponentLoading type="default" />}>
          <ErrorBanner
            error={combinedError}
            onClose={() => {
              setError(null);
              clearProfileError();
            }}
          />
        </Suspense>
      )}

      {/* Chat Header with Suspense */}
      <Suspense fallback={<ComponentLoading type="header" />}>
        <ChatHeader
          plans={plans}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          clearChat={clearChat}
          userProfile={userProfile}
          onNewChat={handleNewChat}
          onToggleHistory={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
          isNewChat={isNewChat}
          onLoad={() => handleComponentLoad("header")}
        />
      </Suspense>

      {/* Main Chat Layout with Enhanced Loading */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-6 h-full flex flex-col">
          <div className="flex gap-2 sm:gap-6 flex-1 min-h-0">
            {/* Enhanced Sidebar with Suspense */}
            <div
              className={`${
                sidebarOpen
                  ? "fixed inset-0 z-50 bg-white lg:relative lg:inset-auto lg:bg-transparent"
                  : "hidden lg:block"
              } w-full lg:w-80 flex-shrink-0 overflow-y-auto lg:h-full p-4 lg:p-0`}
            >
              <Suspense fallback={<ComponentLoading type="sidebar" />}>
                <ChatSidebar
                  plans={plans}
                  selectedPlan={selectedPlan}
                  setSelectedPlan={setSelectedPlan}
                  handleSuggestionClick={handleSuggestionClick}
                  userProfile={userProfile}
                  quickActions={quickActions}
                  onLoad={() => handleComponentLoad("sidebar")}
                />
              </Suspense>
            </div>

            {/* Chat Container with Suspense */}
            <div className="flex-1 min-h-0 min-w-0">
              <Suspense fallback={<ComponentLoading type="chat" />}>
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
                  streamingMessageId={isTyping ? messages[messages.length - 1]?.id : null}
                  streamingContent={isTyping ? messages[messages.length - 1]?.content || "" : ""}
                  onStreamingComplete={(content) => {
                    console.log("Streaming completed:", content);
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AIChatPage;
