// Updated ChatHeader.js
import React from 'react';
import { 
  Menu, 
  Settings, 
  Plus, 
  History,
  Trash2,
  ChevronDown
} from 'lucide-react';

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
  isNewChat
}) => {
  const currentPlan = plans.find(plan => plan.id === selectedPlan);
  const IconComponent = currentPlan?.icon;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left side - Menu and Plan Selector */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Plan selector dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg border border-gray-200 transition-all duration-200 min-w-[180px]">
              {IconComponent && (
                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${currentPlan.color} flex items-center justify-center`}>
                  <IconComponent className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="font-medium text-gray-800 flex-1 text-left truncate">
                {currentPlan?.name || 'Select Plan'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
            </button>

            {/* Dropdown menu */}
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2 space-y-1">
                {plans.map((plan) => {
                  const PlanIcon = plan.icon;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        selectedPlan === plan.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                        <PlanIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium">{plan.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Chat Status */}
        <div className="hidden sm:flex items-center space-x-2">
          {isNewChat ? (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">New Chat</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">Continuing Chat</span>
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2">
          
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            title="Start new chat"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* History Toggle Button */}
          <button
            onClick={onToggleHistory}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
              showHistory 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Toggle chat history"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Clear Chat Button */}
          {!isNewChat && (
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              title="Clear current chat"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* Settings button */}
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile status bar */}
      <div className="sm:hidden mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {userProfile?.name && (
            <span className="text-gray-600">
              Hello, {userProfile.name}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isNewChat ? (
            <div className="flex items-center space-x-1 text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>New</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-blue-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Continuing</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;