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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentPlan = plans.find((plan) => plan.id === selectedPlan);
  const IconComponent = currentPlan?.icon;

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm px-2 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Menu + Plan Selector */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Plan selector dropdown */}
          <div className="relative min-w-[150px]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 px-3 py-2 sm:px-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg border border-gray-200 transition-all duration-200 w-full"
            >
              {IconComponent && (
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-r ${currentPlan.color} flex items-center justify-center`}
                >
                  <IconComponent className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="font-medium text-gray-800 flex-1 text-left truncate text-sm sm:text-base">
                {currentPlan?.name || "Select Plan"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-900 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 space-y-1">
                  {plans.map((plan) => {
                    const PlanIcon = plan.icon;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm ${
                          selectedPlan === plan.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-white text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}
                        >
                          <PlanIcon className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium">{plan.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Chat Status */}
        <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
          {isNewChat ? (
            <div className="flex items-center space-x-2 text-purple-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">New Chat</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-blue-600">
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
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Toggle chat history"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          {!isNewChat && (
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
              title="Clear current chat"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}

          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile - More menu */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {isMobileMenuOpen && (
            <div className="absolute right-2 top-14 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={onNewChat}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 hover:text-gray-900 text-sm"
              >
                New Chat
              </button>
              <button
                onClick={onToggleHistory}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 hover:text-gray-900 text-sm"
              >
                History
              </button>
              {!isNewChat && (
                <button
                  onClick={clearChat}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-100 hover:text-red-700 text-sm"
                >
                  Clear Chat
                </button>
              )}
              <button className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 hover:text-gray-900 text-sm">
                Settings
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Backdrop */}
      {(isDropdownOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default ChatHeader;
