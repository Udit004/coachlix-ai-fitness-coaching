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
    <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg flex-shrink-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                  {getGreeting()}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Ready to level up your training?
                </p>
              </div>
            </div>
            
            {/* Desktop Plan Selector - Hidden on mobile */}
            <div className="hidden xl:flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{plan.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors xl:hidden"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button 
              onClick={clearChat}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button className="hidden sm:block p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;