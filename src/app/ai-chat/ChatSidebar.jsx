// components/ChatSidebar.jsx
import React, { useEffect } from 'react';
import { 
  X, 
  Menu, 
  History, 
  Plus, 
  MessageCircle, 
  Calendar,
  Clock,
  Trash2,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import { useState } from 'react';
import WelcomeCard from './WelcomeCard';
import PlanSelector from './PlanSelector';
import QuickActions from './QuickActions';
import ProgressStats from './ProgressStats';
import GoalProgress from './GoalProgress';
import useChatStore from '@/stores/useChatStore';
import { useChatManager } from '@/hooks/useChatQueries';
import { useAuthContext } from '@/auth/AuthContext';

const ChatHistorySection = ({ 
  chatHistory = [], 
  loading, 
  onSelectChat, 
  onDeleteChat, 
  currentChatId,
  plans = [],
  onNewChat 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  
  const formatDate = (date) => {
    const chatDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (chatDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (chatDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return chatDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPlanIcon = (planId) => {
    const plan = plans?.find(p => p.id === planId);
    return plan?.icon || MessageCircle;
  };

  const getPlanColor = (planId) => {
    const plan = plans?.find(p => p.id === planId);
    return plan?.color || 'from-gray-500 to-gray-600';
  };

  // Filter and search chats
  const filteredChats = chatHistory.filter(chat => {
    const matchesSearch = chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || chat.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const groupChatsByDate = (chats) => {
    const groups = {};
    chats.forEach(chat => {
      const dateKey = formatDate(chat.updatedAt || chat.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="w-16 h-6 bg-gray-300 rounded animate-pulse"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const groupedChats = groupChatsByDate(filteredChats);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Chat History</h3>
          </div>
          <button
            onClick={onNewChat}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Plans</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedChats).length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {searchTerm || filterPlan !== 'all' 
                ? 'No chats match your search'
                : 'No chat history yet'
              }
            </p>
            <p className="text-xs mt-1">
              {searchTerm || filterPlan !== 'all'
                ? 'Try adjusting your filters'
                : 'Start a conversation to see it here'
              }
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {Object.entries(groupedChats).map(([date, chats]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center space-x-2 mb-2 px-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-600">{date}</h4>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Chats for this date */}
                <div className="space-y-2">
                  {chats.map((chat) => {
                    const IconComponent = getPlanIcon(chat.plan);
                    const isActive = currentChatId === chat._id;

                    return (
                      <div
                        key={chat._id}
                        className={`group relative flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => onSelectChat(chat)}
                      >
                        {/* Plan Icon */}
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getPlanColor(chat.plan)} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>

                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {chat.title}
                          </h4>
                          
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {chat.lastMessage}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(chat.updatedAt || chat.createdAt)}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {chat.messageCount || 0} msgs
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatSidebar = ({ 
  plans, 
  selectedPlan, 
  setSelectedPlan, 
  handleSuggestionClick,
  userProfile,
  quickActions
}) => {
  const { user: authUser } = useAuthContext();
  
  // Zustand store
  const {
    sidebarOpen,
    setSidebarOpen,
    showHistory,
    setShowHistory,
    currentChatId,
    startNewChat,
    loadChat
  } = useChatStore();

  // Chat manager with React Query
  const {
    chatHistory,
    historyLoading,
    historyError,
    deleteChat,
    deletingChat
  } = useChatManager(authUser?.uid);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Handle chat selection
  const handleSelectChat = (chat) => {
    loadChat(chat);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  // Handle new chat
  const handleNewChat = () => {
    startNewChat();
    setShowHistory(false);
    setSidebarOpen(false);
  };

  // Handle delete chat
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        handleNewChat(); // Start new chat if current chat was deleted
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        ${sidebarOpen 
          ? 'fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform translate-x-0' 
          : 'hidden lg:block lg:relative lg:inset-auto lg:w-80 lg:bg-transparent lg:shadow-none'
        } 
        transition-transform duration-300 ease-in-out overflow-hidden h-full
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Menu className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Content with Tabs */}
        <div className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                !showHistory
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </div>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                showHistory
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <History className="w-4 h-4" />
                <span>History</span>
                {chatHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {chatHistory.length > 9 ? '9+' : chatHistory.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {showHistory ? (
              /* Chat History Tab */
              <ChatHistorySection
                chatHistory={chatHistory}
                loading={historyLoading}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                currentChatId={currentChatId}
                plans={plans}
                onNewChat={handleNewChat}
              />
            ) : (
              /* Main Menu Tab */
              <div className="h-full overflow-y-auto">
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

                  {/* Personalized Quick Actions */}
                  <QuickActions
                    userProfile={userProfile}
                    handleSuggestionClick={handleSuggestionClick}
                    quickActions={quickActions}
                  />

                  {/* Personalized Stats */}
                  <ProgressStats userProfile={userProfile} />

                  {/* Goal Progress */}
                  <GoalProgress userProfile={userProfile} />

                  {/* Quick Chat History Access */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <History className="w-4 h-4 text-purple-600" />
                        <h3 className="font-medium text-purple-900">Recent Chats</h3>
                      </div>
                      <button
                        onClick={() => setShowHistory(true)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    
                    {historyLoading ? (
                      <div className="space-y-2">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-purple-200 rounded-full"></div>
                              <div className="flex-1 h-3 bg-purple-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : chatHistory.slice(0, 3).length > 0 ? (
                      <div className="space-y-2">
                        {chatHistory.slice(0, 3).map((chat) => (
                          <button
                            key={chat._id}
                            onClick={() => handleSelectChat(chat)}
                            className="w-full flex items-center space-x-2 p-2 text-left hover:bg-purple-100 rounded-lg transition-colors text-sm"
                          >
                            <MessageCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span className="text-purple-800 truncate">
                              {chat.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-purple-600">
                        No recent chats. Start a conversation!
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile Footer */}
                <div className="lg:hidden p-4 border-t border-gray-200 bg-white">
                  <div className="mb-4">
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Close Menu</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">
                      AI Fitness Coach v1.0
                    </p>
                    <p className="text-xs text-gray-400">
                      Powered by Gemini AI
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay for Delete Operations */}
        {deletingChat && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              <span className="text-sm">Deleting chat...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;