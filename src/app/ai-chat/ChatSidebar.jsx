import React, { useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import WelcomeCard from './WelcomeCard';
import PlanSelector from './PlanSelector';
import QuickActions from './QuickActions';
import ProgressStats from './ProgressStats';
import GoalProgress from './GoalProgress';

const ChatSidebar = ({ 
  plans, 
  selectedPlan, 
  setSelectedPlan, 
  sidebarOpen, 
  setSidebarOpen, 
  handleSuggestionClick,
  userProfile,
  quickActions
}) => {
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
        transition-transform duration-300 ease-in-out overflow-y-auto h-full
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
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

        {/* Additional Close Button - Floating */}
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full shadow-md border border-gray-200 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
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

          {/* Mobile Footer with Close Button */}
          <div className="lg:hidden pt-4 border-t border-gray-200">
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
                Powered by DeepSeek AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;