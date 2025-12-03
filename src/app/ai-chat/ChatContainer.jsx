import React, { useRef, useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import { ChevronDown, Menu, Plus } from "./icons";

const ChatContainer = ({
  messages,
  isTyping,
  inputValue,
  setInputValue,
  handleSendMessage,
  handleSuggestionClick,
  handleKeyPress,
  isRecording,
  toggleRecording,
  userProfile,
  textareaRef,
  messagesEndRef,
  formatTime,
  copyToClipboard,
  streamingMessageId = null,
  streamingContent = "",
  onStreamingComplete = null,
  plans = [],
  selectedPlan,
  setSelectedPlan,
  isNewChat = false,
  sidebarOpen = false,
  setSidebarOpen = () => {},
  onNewChat = () => {},
}) => {
  const messagesEndRefInternal = useRef(null);
  const actualMessagesEndRef = messagesEndRef || messagesEndRefInternal;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, streamingContent]); // Only scroll when message count changes or streaming updates

  const scrollToBottom = () => {
    actualMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentPlan = plans.find((plan) => plan.id === selectedPlan);
  const IconComponent = currentPlan?.icon;

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg sm:rounded-xl shadow-sm border border-gray-700 flex flex-col h-full max-h-full overflow-hidden">
      {/* Fixed Header with Plan Selector */}
      <div className="flex-shrink-0 border-b border-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Menu Button - Visible on all screens */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Plan Selector */}
            <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all duration-200"
            >
              {IconComponent && (
                <div
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r ${currentPlan.color} flex items-center justify-center`}
                >
                  <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                </div>
              )}
              <span className="font-medium text-white text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[180px]">
                {currentPlan?.name || "Select Plan"}
              </span>
              <ChevronDown
                className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 sm:w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-1.5">
                  {plans.map((plan) => {
                    const PlanIcon = plan.icon;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md transition-colors text-xs sm:text-sm ${
                          selectedPlan === plan.id
                            ? "bg-blue-900/50 text-blue-400 border border-blue-700"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}
                        >
                          <PlanIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="font-medium truncate">{plan.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </div>

          {/* New Chat Button & Chat Status */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group cursor-pointer"
              title="Start new chat"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">New</span>
            </button>

            {/* Chat Status */}
            <div className="flex items-center space-x-1.5">
              {isNewChat ? (
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-purple-400 font-medium hidden lg:inline">New Chat</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-400 font-medium hidden lg:inline">Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => {
          // Check if this message is currently streaming
          const isStreaming = message.id === streamingMessageId && message.role === "ai";
          
          return (
            <ChatMessage
              key={message.id ?? `message-${index}`}
              message={message}
              handleSuggestionClick={handleSuggestionClick}
              userProfile={userProfile}
              formatTime={formatTime}
              copyToClipboard={copyToClipboard}
              isStreaming={isStreaming}
            />
          );
        })}

        {/* Typing Indicator - Only show if no streaming message */}
        {isTyping && !streamingMessageId && <TypingIndicator userProfile={userProfile} />}

        <div ref={actualMessagesEndRef} />
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-700 p-2 sm:p-4 bg-gray-800/50 rounded-b-lg sm:rounded-b-xl">
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          isTyping={isTyping}
          isRecording={isRecording}
          toggleRecording={toggleRecording}
          textareaRef={textareaRef}
        />
      </div>

      {/* Backdrop for dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(ChatContainer, (prevProps, nextProps) => {
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.inputValue === nextProps.inputValue &&
    prevProps.streamingMessageId === nextProps.streamingMessageId &&
    prevProps.streamingContent === nextProps.streamingContent &&
    prevProps.isRecording === nextProps.isRecording &&
    prevProps.selectedPlan === nextProps.selectedPlan &&
    prevProps.isNewChat === nextProps.isNewChat &&
    prevProps.sidebarOpen === nextProps.sidebarOpen
  );
});
