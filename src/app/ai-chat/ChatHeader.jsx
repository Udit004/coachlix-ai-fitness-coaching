import React from 'react';
import { 
  Bot, 
  Menu, 
  Trash2,
  Settings
} from 'lucide-react';

const ChatHeader = ({ 
  plans, 
  selectedPlan, 
  setSelectedPlan, 
  sidebarOpen, 
  setSidebarOpen, 
  clearChat, 
  userProfile 
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userProfile?.name || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section - Logo and Greeting */}
          <div className="flex items-center space-x-3 flex-1 min-w-0 max-w-xs sm:max-w-sm lg:max-w-md">
            <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {getGreeting()}
              </h1>
              <p className="text-xs text-gray-600 truncate hidden sm:block">
                Ready to level up your training?
              </p>
            </div>
          </div>
          
          {/* Center Section - Plan Selector (Desktop Only) */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-4">
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 max-w-4xl overflow-x-auto">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">{plan.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button 
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button 
              className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Plan Selector - Below header */}
      <div className="lg:hidden border-t border-gray-100 bg-gray-50">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center space-x-2 py-2 overflow-x-auto">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    isSelected
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{plan.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;