// components/ChatSidebar.jsx - Fixed Version
import React, {
  useState,
  useEffect,
  Suspense,
  lazy,
  useMemo,
  useCallback,
} from "react";
import {
  X,
  Menu,
  History,
  Plus,
  MessageCircle,
  Settings,
  User,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import WelcomeCard from "./WelcomeCard";
import PlanSelector from "./PlanSelector";
import QuickActions from "./QuickActions";
import ProgressStats from "./ProgressStats";
import GoalProgress from "./GoalProgress";
import useChatStore from "@/stores/useChatStore";
import useChatHistoryStore from "@/stores/useChatHistoryStore";
import { useAuthContext } from "@/auth/AuthContext";

// Lazy load the ChatHistory component for better performance
const ChatHistory = lazy(() => import("./ChatHistory"));

// Loading component for ChatHistory
const ChatHistoryLoading = () => (
  <div className="h-full flex flex-col animate-pulse">
    <div className="p-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded mb-3"></div>
      <div className="h-9 bg-gray-200 rounded mb-3"></div>
      <div className="flex space-x-2">
        <div className="h-7 bg-gray-200 rounded flex-1"></div>
        <div className="h-7 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div className="flex-1 p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Simple QuickStats component - removed Zustand dependency to avoid infinite loops
const QuickStats = React.memo(({ userProfile }) => {
  // You can replace this with actual stats once the store is fixed
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="font-medium text-indigo-900">Your Progress</h3>
        </div>
        <Sparkles className="w-4 h-4 text-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-900">-</div>
          <div className="text-xs text-indigo-600">Total Chats</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-900">-</div>
          <div className="text-xs text-indigo-600">Messages</div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-indigo-200">
        <div className="text-xs text-indigo-600">Loading stats...</div>
      </div>
    </div>
  );
});

// Simple RecentChatsPreview - removed Zustand dependency to avoid infinite loops
const RecentChatsPreview = React.memo(({ onViewAll, onSelectChat }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-purple-600" />
          <h3 className="font-medium text-purple-900">Recent Chats</h3>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <p className="text-sm text-purple-600">
        View your chat history in the History tab
      </p>
    </div>
  );
});

// Main sidebar component
const ChatSidebar = ({
  plans,
  selectedPlan,
  setSelectedPlan,
  handleSuggestionClick,
  userProfile,
  quickActions,
}) => {
  const { user: authUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' or 'history'

  // Use individual stable selectors
  const sidebarOpen = useChatStore((state) => state.sidebarOpen);
  const currentChatId = useChatStore((state) => state.currentChatId);

  // Get stable action references
  const setSidebarOpen = useChatStore((state) => state.setSidebarOpen);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const loadChat = useChatStore((state) => state.loadChat);
  const fetchChats = useChatHistoryStore((state) => state.fetchChats);

  // Initialize chat history when user is available
  useEffect(() => {
    if (authUser?.uid && activeTab === "history") {
      fetchChats(authUser.uid);
    }
  }, [authUser?.uid, activeTab, fetchChats]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSelectChat = useCallback(
    (chat) => {
      loadChat(chat);
      setSidebarOpen(false);
      setActiveTab("menu");
    },
    [loadChat, setSidebarOpen]
  );

  const handleNewChat = useCallback(() => {
    startNewChat();
    setSidebarOpen(false);
    setActiveTab("menu");
  }, [startNewChat, setSidebarOpen]);

  const handleDeleteChat = useCallback(
    async (chatId) => {
      const deleteChat = useChatHistoryStore.getState().deleteChat;
      try {
        await deleteChat(chatId);
        if (currentChatId === chatId) {
          handleNewChat();
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    },
    [currentChatId, handleNewChat]
  );

  const handleViewAllChats = useCallback(() => {
    setActiveTab("history");
  }, []);

  // Render tab content
  const renderTabContent = () => {
    if (activeTab === "history") {
      return (
        <Suspense fallback={<ChatHistoryLoading />}>
          <ChatHistory
            plans={plans}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onNewChat={handleNewChat}
          />
        </Suspense>
      );
    }

    return (
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-4 space-y-4 lg:space-y-6">
          {/* Personalized Welcome Card */}
          <WelcomeCard userProfile={userProfile} />

          {/* Mobile Plan Selector */}
          <div className="lg:hidden">
            <PlanSelector
              plans={plans}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              variant="mobile"
            />
          </div>

          {/* Quick Stats */}
          <QuickStats userProfile={userProfile} />

          {/* Recent Chats Preview */}
          <RecentChatsPreview
            onViewAll={handleViewAllChats}
            onSelectChat={handleSelectChat}
          />

          {/* Personalized Quick Actions */}
          <QuickActions
            userProfile={userProfile}
            handleSuggestionClick={handleSuggestionClick}
            quickActions={quickActions}
          />

          {/* Progress Stats */}
          <ProgressStats userProfile={userProfile} />

          {/* Goal Progress */}
          <GoalProgress userProfile={userProfile} />

          {/* Settings Preview */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Profile</h3>
              </div>
              <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {userProfile && (
              <div className="mt-3 text-sm text-gray-600">
                <p className="font-medium text-gray-900">{userProfile.name}</p>
                <p className="capitalize">
                  {userProfile.fitnessGoal?.replace("-", " ")} goal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden sticky bottom-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Close Menu</span>
          </button>

          <div className="text-center mt-3">
            <p className="text-xs text-gray-500 mb-1">AI Fitness Coach v1.0</p>
            <p className="text-xs text-gray-400">Powered by Gemini AI</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
        ${
          sidebarOpen
            ? "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform translate-x-0"
            : "hidden lg:block lg:relative lg:inset-auto lg:w-80 lg:bg-transparent lg:shadow-none"
        } 
        transition-all duration-300 ease-in-out h-full flex flex-col
      `}
      >
        {/* Enhanced Mobile Header */}
        <div className="lg:hidden flex-shrink-0 sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <Menu className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Coach</h2>
              <p className="text-xs text-gray-500">Your fitness companion</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex-shrink-0 flex border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-[73px] lg:top-0 z-10">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
              activeTab === "menu"
                ? "text-blue-600 bg-blue-50/80"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Menu className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            {activeTab === "menu" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
              activeTab === "history"
                ? "text-blue-600 bg-blue-50/80"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <History className="w-4 h-4" />
              <span>History</span>
            </div>
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">{renderTabContent()}</div>
      </div>
    </>
  );
};

export default ChatSidebar;