// ChatHeader.js - Fully Mobile Responsive Version
import React, { useState } from "react";
import {
  Menu,
  Plus,
  History,
  ChevronDown,
  Settings,
  MoreVertical,
  Trash2,
} from "./icons";

const ChatHeader = ({
  plans,
  selectedPlan,
  setSelectedPlan,
  sidebarOpen,
  setSidebarOpen,
  clearChat,
  userProfile,
  onNewChat,
  onToggleHistory,
  showHistory,
  isNewChat,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-16 z-40 bg-gray-800 border-b border-gray-700 shadow-sm px-2 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Menu button only */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center - Chat Status */}
        <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
          {isNewChat ? (
            <div className="flex items-center space-x-2 text-purple-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">New Chat</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">Continuing Chat</span>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="hidden sm:flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onNewChat}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            title="Start new chat"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <button
            onClick={onToggleHistory}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
              showHistory
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            title="Toggle chat history"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          {!isNewChat && (
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900/70 text-sm font-medium border border-red-800"
              title="Clear current chat"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}

          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile - More menu */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {isMobileMenuOpen && (
            <div className="absolute right-2 top-14 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
              <button
                onClick={onNewChat}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white text-sm"
              >
                New Chat
              </button>
              <button
                onClick={onToggleHistory}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white text-sm"
              >
                History
              </button>
              {!isNewChat && (
                <button
                  onClick={clearChat}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/50 hover:text-red-300 text-sm"
                >
                  Clear Chat
                </button>
              )}
              <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white text-sm">
                Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default ChatHeader;
