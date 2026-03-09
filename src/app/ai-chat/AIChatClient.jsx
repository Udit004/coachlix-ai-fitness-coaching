// AIChatClient.jsx — Client component for AI Chat page
// SSR chat history is pre-loaded via HydrationBoundary; initialProfile seeds Zustand.
"use client";
import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import useUserProfileStore from "@/stores/useUserProfileStore";
import useChatStore from "@/stores/useChatStore";
import useChatHistoryStore from "@/stores/useChatHistoryStore";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { useChatInitialization, useSaveChat, useUpdateChat, useDeleteChat } from "@/hooks/useChatQueries";
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
} from "./icons";
import { useAuthContext } from "../../auth/AuthContext";

const ChatHeader = lazy(() => import(/* webpackChunkName: "chat-header" */ "./ChatHeader"));
const ChatSidebar = lazy(() => import(/* webpackChunkName: "chat-sidebar" */ "./ChatSidebar"));
const ChatContainer = lazy(() => import(/* webpackChunkName: "chat-container" */ "./ChatContainer"));
const ErrorBanner = lazy(() => import(/* webpackChunkName: "error-banner" */ "./ErrorBanner"));

const EnhancedLoading = lazy(() => import(/* webpackChunkName: "enhanced-loading" */ "./EnhancedLoading"));
const ProfileLoading = lazy(() => import(/* webpackChunkName: "enhanced-loading" */ "./EnhancedLoading").then(m => ({ default: m.ProfileLoading })));
const ChatLoading = lazy(() => import(/* webpackChunkName: "enhanced-loading" */ "./EnhancedLoading").then(m => ({ default: m.ChatLoading })));
const InitializingLoading = lazy(() => import(/* webpackChunkName: "enhanced-loading" */ "./EnhancedLoading").then(m => ({ default: m.InitializingLoading })));

const ComponentLoading = ({ type = "default" }) => (
  <div className="animate-pulse">
    {type === "header" && <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>}
    {type === "sidebar" && <div className="w-80 h-full bg-gray-200 rounded-lg"></div>}
    {type === "chat" && <div className="flex-1 bg-gray-200 rounded-lg"></div>}
    {type === "default" && <div className="h-32 bg-gray-200 rounded-lg"></div>}
  </div>
);

const AIChatClient = ({ initialProfile = null }) => {
  const { user: authUser, loading: authLoading } = useAuthContext();

  // ── Determine initial stage — skip directly to "ready" if SSR data present ──
  const hasSSRData = initialProfile !== null;
  const [initializingStage, setInitializingStage] = useState(
    hasSSRData ? "ready" : "initial"
  );

  // ── Seed Zustand profile store from SSR prop (runs once after mount) ──────────
  useEffect(() => {
    if (initialProfile && !useUserProfileStore.getState().profile) {
      useUserProfileStore.setState({
        profile: initialProfile,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [componentLoaded, setComponentLoaded] = useState({
    header: false,
    sidebar: false,
    chat: false,
  });

  // ── Zustand stores ────────────────────────────────────────────────────────
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

  const {
    profile: userProfile,
    loading: profileLoading,
    error: profileError,
    fetchUserProfile,
    hasValidProfile,
    clearError: clearProfileError,
  } = useUserProfileStore();

  const {
    messages: cachedMessages,
    history: chatHistory,
    currentChat,
    isLoading: isChatLoading,
    isLoadingHistory: isHistoryLoading,
    historyError,
    chatError,
  } = useChatInitialization(authUser?.uid, currentChatId);

  const saveChat = useSaveChat();
  const updateChat = useUpdateChat();
  const deleteChat = useDeleteChat();

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const plans = [
    { id: "general", name: "General Fitness", icon: Activity, color: "from-blue-500 to-purple-600" },
    { id: "badminton", name: "Badminton Player", icon: Target, color: "from-green-500 to-emerald-600" },
    { id: "weight-loss", name: "Weight Loss", icon: Apple, color: "from-orange-500 to-red-600" },
    { id: "muscle-gain", name: "Muscle Building", icon: Dumbbell, color: "from-purple-500 to-pink-600" },
    { id: "strength", name: "Strength Training", icon: Dumbbell, color: "from-purple-500 to-indigo-600" },
    { id: "cardio", name: "Cardio Focus", icon: Heart, color: "from-red-500 to-pink-600" },
    { id: "sports", name: "Sports Training", icon: Trophy, color: "from-yellow-500 to-orange-600" },
    { id: "quick", name: "Quick Workouts", icon: Zap, color: "from-green-500 to-blue-600" },
  ];

  const quickActions = [
    { icon: Dumbbell, text: "Create a workout plan for me", color: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { icon: Apple, text: "Design a nutrition plan", color: "bg-gradient-to-r from-green-500 to-green-600" },
    { icon: Calendar, text: "Help me create a weekly schedule", color: "bg-gradient-to-r from-orange-500 to-orange-600" },
    { icon: Target, text: "Set fitness goals with me", color: "bg-gradient-to-r from-purple-500 to-purple-600" },
  ];

  // ── Set sidebar open by default on desktop ────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarOpen(window.innerWidth >= 1024);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mobile keyboard fix ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.classList.add("ai-chat-mobile-lock");
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.classList.remove("ai-chat-mobile-lock");
      }
    };
  }, []);

  // ── Initialization — skipped entirely when SSR data is present ────────────
  useEffect(() => {
    if (hasSSRData) return; // Already at "ready" — nothing to do

    const initializeApp = async () => {
      if (authLoading) return;

      try {
        setInitializingStage("initializing");
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!authUser) return;

        setInitializingStage("profile");
        if (profileError) clearProfileError();

        if (!hasValidProfile()) {
          await fetchUserProfile(authUser.uid, { maxAge: 5 * 60 * 1000 });
        }

        setInitializingStage("chat");
        await new Promise((resolve) => setTimeout(resolve, 600));

        setInitializingStage("ready");
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch (err) {
        console.error("Failed to initialize app:", err);
        setError("Failed to load your profile. Some features may not work properly.");
        setInitializingStage("error");
      }
    };

    initializeApp();
  }, [authUser, authLoading, fetchUserProfile, hasValidProfile, profileError, clearProfileError, setError, hasSSRData]);

  // ── Sync TanStack Query cache → Zustand chat history store ───────────────
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      useChatHistoryStore.setState({ chats: chatHistory, loading: false, error: null });
    }
  }, [chatHistory]);

  // ── Sync current chat messages ────────────────────────────────────────────
  useEffect(() => {
    if (currentChat && currentChat.messages && currentChatId) {
      setMessages(currentChat.messages);
    }
  }, [currentChat, currentChatId, setMessages]);

  // ── Handle query errors ───────────────────────────────────────────────────
  useEffect(() => {
    if (historyError) setError("Failed to load chat history");
    if (chatError) setError("Failed to load chat");
  }, [historyError, chatError, setError]);

  const handleComponentLoad = (componentName) => {
    setComponentLoaded((prev) => ({ ...prev, [componentName]: true }));
  };

  // ── Send message with streaming ───────────────────────────────────────────
  const handleSendMessage = async (messageData) => {
    const message =
      typeof messageData === "object" && messageData !== null
        ? messageData.text || inputValue
        : messageData || inputValue;
    const files = messageData?.files || [];

    if (!message.trim() && files.length === 0) return;
    if (isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: message,
      timestamp: new Date(),
      plan: selectedPlan,
      files: files.length > 0 ? files : undefined,
    };

    addMessage(userMessage);
    const currentInput = message;
    setInputValue("");
    setIsTyping(true);
    setError(null);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          plan: selectedPlan,
          chatId: currentChatId,
          userId: authUser?.uid,
          files: files.length > 0
            ? files.map((file) => ({ name: file.name, type: file.type, size: file.size, category: file.category, url: file.url }))
            : undefined,
          streaming: true,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamingContent = "";
      let suggestions = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "connection":
                  break;
                case "word":
                  streamingContent += data.word;
                  updateLastMessage({ ...aiMessage, content: streamingContent });
                  break;
                case "complete": {
                  const finalMessage = { ...aiMessage, content: data.fullResponse, suggestions: data.suggestions || [] };
                  updateLastMessage(finalMessage);

                  if (authUser?.uid) {
                    const updatedMessages = [...messages, userMessage, finalMessage];
                    if (isNewChat && updatedMessages.length >= 2) {
                      const title = generateChatTitle(updatedMessages);
                      try {
                        const result = await saveChat.mutateAsync({ userId: authUser.uid, title, plan: selectedPlan, messages: updatedMessages });
                        if (result.chatId) { setCurrentChatId(result.chatId); setIsNewChat(false); }
                      } catch (err) { console.error("Failed to save chat:", err); }
                    } else if (currentChatId) {
                      try { await updateChat.mutateAsync({ chatId: currentChatId, messages: updatedMessages }); }
                      catch (err) { console.error("Failed to update chat:", err); }
                    }
                  }
                  break;
                }
                case "error":
                  throw new Error(data.error);
                default:
                  break;
              }
            } catch (parseError) {
              console.error("Error parsing streaming data:", parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      updateLastMessage({
        ...aiMessage,
        content: `I apologize, but I'm having trouble responding right now. ${errorMessage}`,
        suggestions: ["Try again", "Check connection", "Refresh page"],
        isError: true,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectChat = (chat) => {
    loadChat(chat);
    toast.success("Chat loaded successfully");
  };

  const handleNewChat = () => {
    startNewChat();
    if (userProfile && !profileLoading) {
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
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat.mutateAsync(chatId);
      if (currentChatId === chatId) handleNewChat();
      toast.success("Chat deleted successfully");
    } catch (err) {
      console.error("Failed to delete chat:", err);
      toast.error("Failed to delete chat");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast.success(isRecording ? "Voice recording stopped" : "Voice recording started");
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const clearChat = () => {
    if (messages.length > 1) { handleNewChat(); toast.success("Started new chat"); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Welcome message on first load ─────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0 && userProfile && !profileLoading && isNewChat) {
      setMessages([{
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
      }]);
    }
  }, [userProfile, profileLoading, isNewChat, messages.length, setMessages]);

  const combinedError = error || profileError;

  // ── Loading screens — only shown when there's no SSR data ────────────────
  if (authLoading || initializingStage !== "ready") {
    const LoadingFallback = () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

    switch (initializingStage) {
      case "initial":
      case "initializing":
        return <Suspense fallback={<LoadingFallback />}><InitializingLoading /></Suspense>;
      case "profile":
        return <ProfileLoading />;
      case "chat":
        return <ChatLoading />;
      case "error":
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-900/50 rounded-full flex items-center justify-center border border-red-700">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-400 mb-4">We're having trouble loading your AI trainer. Please try refreshing the page.</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Refresh Page
              </button>
            </div>
          </div>
        );
      default:
        return <Suspense fallback={<LoadingFallback />}><EnhancedLoading stage={initializingStage} /></Suspense>;
    }
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="ai-chat-page bg-gray-900 flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { background: "#1f2937", color: "#fff", borderRadius: "12px", fontSize: "14px" },
        }}
      />

      {combinedError && (
        <Suspense fallback={<ComponentLoading type="default" />}>
          <ErrorBanner error={combinedError} onClose={() => { setError(null); clearProfileError(); }} />
        </Suspense>
      )}

      <div className="flex-1 min-h-0">
        <div className="w-full h-full px-1 sm:px-3 py-1 sm:py-3 flex flex-col">
          <div className="flex gap-1 sm:gap-4 flex-1 min-h-0">
            {sidebarOpen && (
              <div className="fixed top-16 left-0 bottom-0 z-40 lg:relative lg:top-0 lg:z-0 lg:inset-auto w-full lg:w-80 flex-shrink-0">
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
            )}

            <div className="flex-1 h-full">
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
                  onStreamingComplete={(content) => { console.log("Streaming completed:", content); }}
                  plans={plans}
                  selectedPlan={selectedPlan}
                  setSelectedPlan={setSelectedPlan}
                  isNewChat={isNewChat}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  onNewChat={handleNewChat}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AIChatClient;
