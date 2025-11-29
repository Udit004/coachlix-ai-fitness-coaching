// components/ChatHistory/ChatHistory.jsx - Fixed Scrollable Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  History, 
  Plus, 
  Calendar,
  Clock,
  AlertCircle
} from './icons';
import { 
  Trash2,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Pin,
  Archive,
  RefreshCw,
  MessageCircle
} from 'lucide-react'; // Keep less common icons from lucide
import { useInView } from 'react-intersection-observer';
import useChatHistoryStore from '@/stores/useChatHistoryStore';
import { useAuthContext } from '@/auth/AuthContext';

// Skeleton loading component
const ChatHistorySkeleton = ({ count = 5 }) => (
  <div className="p-4 space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-300 rounded w-16"></div>
              <div className="h-3 bg-gray-300 rounded w-12"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyState = ({ searchTerm, filterPlan, onNewChat }) => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-600">
        {searchTerm || filterPlan !== 'all' ? (
          <Search className="w-8 h-8 text-gray-400" />
        ) : (
          <MessageCircle className="w-8 h-8 text-gray-400" />
        )}
      </div>
      
      <h3 className="text-lg font-medium text-white mb-2">
        {searchTerm || filterPlan !== 'all' ? 'No matching chats' : 'No chat history yet'}
      </h3>
      
      <p className="text-gray-400 mb-4 text-sm">
        {searchTerm || filterPlan !== 'all' 
          ? 'Try adjusting your search or filters'
          : 'Start your first conversation to see it here'
        }
      </p>
      
      <button
        onClick={onNewChat}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Start New Chat</span>
      </button>
    </div>
  </div>
);

// Error state component
const ErrorState = ({ error, onRetry }) => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-900/50 rounded-full flex items-center justify-center border border-red-800">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Unable to load chats</h3>
      <p className="text-gray-400 mb-4 text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  </div>
);

// Individual chat item component
const ChatItem = React.memo(({ 
  chat, 
  isActive, 
  onSelect, 
  onDelete, 
  onPin,
  getPlanIcon, 
  getPlanColor,
  formatTime 
}) => {
  const [showActions, setShowActions] = useState(false);
  const IconComponent = getPlanIcon(chat.plan);

  return (
    <div
      className={`group relative flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
        isActive
          ? 'bg-blue-900/30 border-blue-700 shadow-sm ring-1 ring-blue-700'
          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
      }`}
      onClick={() => onSelect(chat)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Plan Icon */}
      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getPlanColor(chat.plan)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <IconComponent className="w-4 h-4 text-white" />
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className={`text-sm font-medium truncate ${
            isActive ? 'text-blue-300' : 'text-gray-200'
          }`}>
            {chat.isPinned && <Pin className="inline w-3 h-3 mr-1 text-amber-500" />}
            {chat.title}
          </h4>
          {chat.isArchived && (
            <Archive className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-xs text-gray-400 truncate mb-2">
          {chat.lastMessage}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(chat.updatedAt || chat.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>{chat.messageCount || 0} msgs</span>
            {chat.isNew && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                New
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center space-x-1 transition-opacity duration-200 ${
        showActions || isActive ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin(chat._id);
          }}
          className={`p-1 rounded transition-colors ${
            chat.isPinned 
              ? 'text-amber-400 hover:text-amber-300' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
          title={chat.isPinned ? 'Unpin chat' : 'Pin chat'}
        >
          <Pin className="w-4 h-4" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chat._id);
          }}
          className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
          title="Delete chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// Date group component
const DateGroup = React.memo(({ 
  date, 
  chats, 
  isExpanded, 
  onToggle, 
  currentChatId, 
  onSelectChat, 
  onDeleteChat, 
  onPinChat,
  getPlanIcon, 
  getPlanColor, 
  formatTime 
}) => (
  <div className="mb-4">
    {/* Date Header */}
    <button
      onClick={() => onToggle(date)}
      className="flex items-center justify-between w-full px-2 py-2 text-left hover:bg-gray-700/50 rounded-lg transition-colors"
    >
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-medium text-gray-300">{date}</h4>
        <span className="text-xs text-gray-500">({chats.length})</span>
      </div>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
        isExpanded ? 'transform rotate-180' : ''
      }`} />
    </button>

    {/* Collapsible Chat List */}
    {isExpanded && (
      <div className="mt-2 space-y-2 ml-2">
        {chats.map((chat) => (
          <ChatItem
            key={chat._id}
            chat={chat}
            isActive={currentChatId === chat._id}
            onSelect={onSelectChat}
            onDelete={onDeleteChat}
            onPin={onPinChat}
            getPlanIcon={getPlanIcon}
            getPlanColor={getPlanColor}
            formatTime={formatTime}
          />
        ))}
      </div>
    )}
  </div>
));

const ChatHistory = ({ 
  plans = [], 
  currentChatId, 
  onSelectChat, 
  onDeleteChat, 
  onNewChat 
}) => {
  const { user: authUser } = useAuthContext();
  
  // Zustand store
  const {
    chats,
    loading,
    error,
    hasMore,
    searchTerm,
    filterPlan,
    sortBy,
    expandedDates,
    // Actions
    fetchChats,
    loadMoreChats,
    setSearchTerm,
    setFilterPlan,
    setSortBy,
    toggleDateGroup,
    pinChat,
    archiveChat,
    clearSearch,
    retryFetch
  } = useChatHistoryStore();

  // Intersection observer for lazy loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false
  });

  // Load more chats when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreChats();
    }
  }, [inView, hasMore, loading, loadMoreChats]);

  // Initial load
  useEffect(() => {
    if (authUser?.uid) {
      fetchChats(authUser.uid);
    }
  }, [authUser?.uid, fetchChats]);

  // Utility functions
  const formatDate = useCallback((date) => {
    const chatDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    if (chatDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (chatDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (chatDate > thisWeek) {
      return 'This Week';
    } else {
      return chatDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: chatDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }, []);

  const formatTime = useCallback((date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const getPlanIcon = useCallback((planId) => {
    const plan = plans?.find(p => p.id === planId);
    return plan?.icon || MessageCircle;
  }, [plans]);

  const getPlanColor = useCallback((planId) => {
    const plan = plans?.find(p => p.id === planId);
    return plan?.color || 'from-gray-500 to-gray-600';
  }, [plans]);

  // Filter and group chats
  const groupedChats = useMemo(() => {
    const filtered = chats.filter(chat => {
      const matchesSearch = !searchTerm || 
        chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = filterPlan === 'all' || chat.plan === filterPlan;
      return matchesSearch && matchesPlan;
    });

    // Sort chats
    const sorted = [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'oldest':
          return new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt);
        case 'messages':
          return (b.messageCount || 0) - (a.messageCount || 0);
        default:
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
    });

    // Group by date
    const groups = {};
    sorted.forEach(chat => {
      const dateKey = formatDate(chat.updatedAt || chat.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });

    return groups;
  }, [chats, searchTerm, filterPlan, sortBy, formatDate]);

  // Handle pin chat
  const handlePinChat = useCallback(async (chatId) => {
    try {
      await pinChat(chatId);
    } catch (error) {
      console.error('Failed to pin chat:', error);
    }
  }, [pinChat]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (authUser?.uid) {
      retryFetch(authUser.uid);
    }
  }, [authUser?.uid, retryFetch]);

  if (error && chats.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-white">Chat History</h3>
            {chats.length > 0 && (
              <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs font-medium border border-blue-800">
                {chats.length}
              </span>
            )}
          </div>
          <button
            onClick={onNewChat}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-700 bg-gray-800 text-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="all">All Plans</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 border border-gray-700 bg-gray-800 text-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="messages">Most Active</option>
          </select>
        </div>
      </div>

      {/* Scrollable Chat List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {loading && chats.length === 0 ? (
          <ChatHistorySkeleton />
        ) : Object.keys(groupedChats).length === 0 ? (
          <EmptyState 
            searchTerm={searchTerm}
            filterPlan={filterPlan}
            onNewChat={onNewChat}
          />
        ) : (
          <div className="p-3">
            {Object.entries(groupedChats).map(([date, dateChats]) => (
              <DateGroup
                key={date}
                date={date}
                chats={dateChats}
                isExpanded={expandedDates[date] !== false}
                onToggle={toggleDateGroup}
                currentChatId={currentChatId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                onPinChat={handlePinChat}
                getPlanIcon={getPlanIcon}
                getPlanColor={getPlanColor}
                formatTime={formatTime}
              />
            ))}

            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {loading ? (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading more chats...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMoreChats}
                    className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Load More
                  </button>
                )}
              </div>
            )}

            {error && chats.length > 0 && (
              <div className="p-4 text-center text-red-400 text-sm">
                Error loading more chats. 
                <button 
                  onClick={handleRetry}
                  className="ml-1 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;