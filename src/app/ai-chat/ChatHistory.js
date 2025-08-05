// components/ChatHistory.js
import React, { useState } from 'react';
import { 
  MessageCircle, 
  Calendar, 
  Trash2, 
  MoreVertical,
  Clock,
  Edit3,
  Check,
  X
} from 'lucide-react';

const ChatHistory = ({ 
  chatHistory, 
  loading, 
  onSelectChat, 
  onDeleteChat, 
  currentChatId,
  plans
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);

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

  const handleEditStart = (chat) => {
    setEditingId(chat._id);
    setEditTitle(chat.title);
    setShowDropdown(null);
  };

  const handleEditSave = () => {
    // You can add update logic here if needed
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const groupChatsByDate = (chats) => {
    const groups = {};
    chats.forEach(chat => {
      const dateKey = formatDate(chat.updatedAt);
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

  const groupedChats = groupChatsByDate(chatHistory);

  return (
    <div className="h-full overflow-y-auto">
      {Object.keys(groupedChats).length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No chat history yet</p>
          <p className="text-xs mt-1">Start a conversation to see it here</p>
        </div>
      ) : (
        <div className="p-3 space-y-4">
          {Object.entries(groupedChats).map(([date, chats]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center space-x-2 mb-2 px-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-600">{date}</h3>
              </div>

              {/* Chats for this date */}
              <div className="space-y-2">
                {chats.map((chat) => {
                  const IconComponent = getPlanIcon(chat.plan);
                  const isActive = currentChatId === chat._id;
                  const isEditing = editingId === chat._id;

                  return (
                    <div
                      key={chat._id}
                      className={`group relative flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => !isEditing && onSelectChat(chat)}
                    >
                      {/* Plan Icon */}
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getPlanColor(chat.plan)} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 text-sm font-medium bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={handleEditSave}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <h4 className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {chat.title}
                          </h4>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            {chat.lastMessage}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-gray-400 ml-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(chat.updatedAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {chat.messageCount} messages
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {chat.plan.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {!isEditing && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(showDropdown === chat._id ? null : chat._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showDropdown === chat._id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStart(chat);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat._id);
                                  setShowDropdown(null);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;