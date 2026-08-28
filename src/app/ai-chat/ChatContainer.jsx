"use client";

import React, { useRef, useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import { ChevronDown, Menu, Plus, Sparkles, Brain, Loader2, Dumbbell, Apple, Calendar, Target, MessageCircle, User } from "./icons";
import {
  useMessageEnterAnimation,
  useStatusBannerAnimation,
} from "../../hooks/useChatAnimations";

// Wraps a ChatMessage with a smooth GSAP entrance animation. Positioned
// correctly on every screen size; respects reduced-motion via the hook.
const AnimatedMessage = React.memo(function AnimatedMessage({
  message,
  index,
  isStreaming,
  handleSuggestionClick,
  userProfile,
  formatTime,
  copyToClipboard,
  aiStatus,
}) {
  const ref = useRef(null);
  useMessageEnterAnimation(ref, {
    align: message.role === "user" ? "user" : "assistant",
    delay: 0.05 * Math.min(index, 3),
  });

  return (
    <div ref={ref} data-chat-message style={{ opacity: 1, transform: "none" }}>
      <ChatMessage
        message={message}
        handleSuggestionClick={handleSuggestionClick}
        userProfile={userProfile}
        formatTime={formatTime}
        copyToClipboard={copyToClipboard}
        isStreaming={isStreaming}
        aiStatus={aiStatus}
      />
    </div>
  );
});

// Renders a prominent, pulsing indicator of what the AI agent is doing
// (thinking, classifying intent, calling tools, streaming, etc.).
// Driven by backend `ai_event` SSE lifecycle events.
const AIStatusBanner = ({ status }) => {
  const bannerRef = useRef(null);
  const statusKey = `${status?.type}|${status?.label}|${status?.tool}|${status?.intent}|${status?.startedAt}`;
  useStatusBannerAnimation(bannerRef, statusKey);

  if (!status) return null;

  const { type = "", label, tool, intent } = status;
  const isTool = type.includes("tool");
  const isThinking = type.includes("thinking") || type.includes("reasoning");
  const isStreaming = type.includes("token.streamed");

  // Hide the banner once streaming begins because the user can already see the text typing out.
  if (isStreaming) return null;

  const Icon = isTool ? Loader2 : isThinking ? Brain : Sparkles;

  const colorByType = isTool
    ? "from-orange-500/20 via-orange-500/5 to-transparent border-orange-500/40 text-orange-400 shadow-orange-500/10"
    : isThinking
    ? "from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/40 text-purple-400 shadow-purple-500/10"
    : "from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/40 text-blue-400 shadow-blue-500/10";

  const iconAnimation = isTool ? "animate-spin" : isThinking ? "animate-pulse" : "animate-bounce";

  return (
    <div
      className="flex justify-start w-full px-2 sm:px-4 pt-2 pb-2"
      ref={bannerRef}
      style={{ opacity: 1, transform: "none" }}
    >
      <div
        className={`w-fit max-w-[90%] sm:max-w-lg flex items-center gap-3 px-4 py-2.5 rounded-2xl border bg-gradient-to-r ${colorByType} backdrop-blur-md shadow-lg transition-all duration-300 relative overflow-hidden`}
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />

        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 border border-gray-700/80 flex items-center justify-center shadow-inner relative z-10">
          <Icon className={`w-4 h-4 ${iconAnimation}`} />
        </div>
        <div className="min-w-0 flex-1 pr-2 relative z-10">
          <div className="text-sm font-semibold tracking-wide flex items-center gap-2">
            {label || "Processing..."}
            <span className="flex items-center gap-0.5 mt-1">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
          {(tool || intent) && (
            <div className="text-[11px] sm:text-xs text-gray-400/90 truncate mt-0.5 font-medium">
              {tool ? (
                <>
                  Using tool: <span className="text-orange-300/90">{tool}</span>
                </>
              ) : (
                <>
                  Goal identified: <span className="text-blue-300/90">{intent}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatContainer = ({
  messages,
  isTyping,
  aiStatus = null,
  inputValue,
  setInputValue,
  handleSendMessage,
  handleSuggestionClick,
  handleKeyPress,
  isRecording,
  toggleRecording,
  isLiveAudioActive = false,
  isLiveAudioConnecting = false,
  onToggleLiveAudio = () => {},
  liveAudioError = null,
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
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, streamingContent]); // Only scroll when message count changes or streaming updates

  const scrollToBottom = () => {
    actualMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show button if we are scrolled up by more than 100px from the bottom
    if (scrollHeight - scrollTop - clientHeight > 100) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  const currentPlan = plans.find((plan) => plan.id === selectedPlan);
  const IconComponent = currentPlan?.icon;

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setIsDropdownOpen(false);
  };

  const isEmptyChat = messages.length === 0 && !isTyping;

  return (
    <div className="bg-gray-800/50 rounded-lg sm:rounded-xl shadow-sm border border-gray-700 flex flex-col h-full max-h-full overflow-hidden">
      {/* Fixed Header with Plan Selector */}
      <div className="flex-shrink-0 border-b border-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Menu Button - Visible on all screens */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Plan Selector */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-700/50 hover:bg-gray-700 active:bg-gray-600 rounded-lg border border-gray-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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

              {/* Dropdown menu — z-50 so it always sits above the backdrop (z-30) */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 sm:w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-1.5">
                    {plans.map((plan) => {
                      const PlanIcon = plan.icon;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => handlePlanSelect(plan.id)}
                          className={`w-full flex items-center space-x-2.5 min-h-[40px] px-2.5 py-2.5 rounded-md transition-colors text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            selectedPlan === plan.id
                              ? "bg-blue-900/50 text-blue-400 border border-blue-700"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
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
              className="flex items-center space-x-1.5 min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 active:scale-95 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              title="Start new chat"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">New</span>
            </button>

            {/* Chat Status - shows live AI lifecycle status if available */}
            {/* <div className="flex items-center space-x-1.5">
              {aiStatus ? (
                <div className="flex items-center space-x-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400 font-medium truncate max-w-[160px]">
                    {aiStatus.label}
                  </span>
                </div>
              ) : isNewChat ? (
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
            </div> */}
          </div>
        </div>
      </div>

      {isEmptyChat ? (
        <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-6 overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full pt-10 pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 transform hover:scale-105 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
              Welcome back{userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}!
            </h2>
            <p className="text-gray-400 text-center mb-8 max-w-md">
              I'm your personal AI fitness coach. How can I help you reach your goals today?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
              {[
                { icon: Dumbbell, text: "Create a workout plan for me", color: "from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30" },
                { icon: Apple, text: "Design a nutrition plan", color: "from-green-500/20 to-green-600/20 text-green-400 border-green-500/30" },
                { icon: Calendar, text: "Help me create a weekly schedule", color: "from-orange-500/20 to-orange-600/20 text-orange-400 border-orange-500/30" },
                { icon: Target, text: "Set fitness goals with me", color: "from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/30" },
              ].map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(action.text);
                      handleSendMessage(action.text);
                    }}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border bg-gradient-to-br ${action.color} hover:brightness-110 active:scale-[0.98] transition-all text-left group`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium leading-tight">{action.text}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="w-full mt-auto">
              <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSendMessage={handleSendMessage}
                handleKeyPress={handleKeyPress}
                isTyping={isTyping}
                isRecording={isRecording}
                toggleRecording={toggleRecording}
                isLiveAudioActive={isLiveAudioActive}
                isLiveAudioConnecting={isLiveAudioConnecting}
                onToggleLiveAudio={onToggleLiveAudio}
                liveAudioError={liveAudioError}
                textareaRef={textareaRef}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Messages - Scrollable Area. overscroll-contain stops scroll
              from "leaking" into the page behind it once you hit the top/bottom
              on mobile (a common source of accidental page-scroll bugs). */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-4 space-y-3 sm:space-y-4 relative"
            onScroll={handleScroll}
          >
            {messages.map((message, index) => {
              // Check if this message is currently streaming
              const isStreaming = message.id === streamingMessageId && message.role === "ai";

              return (
                <AnimatedMessage
                  key={message.id ?? `message-${index}`}
                  message={message}
                  index={index}
                  handleSuggestionClick={handleSuggestionClick}
                  userProfile={userProfile}
                  formatTime={formatTime}
                  copyToClipboard={copyToClipboard}
                  isStreaming={isStreaming}
                  aiStatus={isStreaming ? aiStatus : null}
                />
              );
            })}

            {/* AI status banner - shows live lifecycle events (thinking,
                tool calling, intent, streaming) driven by backend SSE */}
            {/* {aiStatus && <AIStatusBanner status={aiStatus} />} */}

            {/* Typing Indicator - Only show if no streaming message */}
            {/* {isTyping && !streamingMessageId && <TypingIndicator userProfile={userProfile} />} */}

            <div ref={actualMessagesEndRef} className="h-4" />
          </div>

          {showScrollButton && (
            <div className="absolute bottom-24 right-6 z-40">
              <button
                onClick={scrollToBottom}
                className="w-10 h-10 bg-gray-700/80 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg border border-gray-600 backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Chat Input - Fixed at Bottom. The extra bottom padding respects
              the iOS home-indicator / notch safe area when this is used inside
              a PWA or mobile webview — falls back to 0.5rem on browsers that
              don't support env(). Requires `viewport-fit=cover` in your
              viewport meta tag for env(safe-area-inset-bottom) to be non-zero. */}
          <div className="flex-shrink-0 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-b-lg sm:rounded-b-xl relative z-20">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              handleKeyPress={handleKeyPress}
              isTyping={isTyping}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              isLiveAudioActive={isLiveAudioActive}
              isLiveAudioConnecting={isLiveAudioConnecting}
              onToggleLiveAudio={onToggleLiveAudio}
              liveAudioError={liveAudioError}
              textareaRef={textareaRef}
            />
          </div>
        </>
      )}

      {/* Backdrop for dropdown — z-30, strictly below the dropdown's z-50 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-30"
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
    prevProps.aiStatus?.type === nextProps.aiStatus?.type &&
    prevProps.aiStatus?.label === nextProps.aiStatus?.label &&
    prevProps.aiStatus?.tool === nextProps.aiStatus?.tool &&
    prevProps.aiStatus?.intent === nextProps.aiStatus?.intent &&
    prevProps.aiStatus?.startedAt === nextProps.aiStatus?.startedAt &&
    prevProps.inputValue === nextProps.inputValue &&
    prevProps.streamingMessageId === nextProps.streamingMessageId &&
    prevProps.streamingContent === nextProps.streamingContent &&
    prevProps.isRecording === nextProps.isRecording &&
    prevProps.isLiveAudioActive === nextProps.isLiveAudioActive &&
    prevProps.isLiveAudioConnecting === nextProps.isLiveAudioConnecting &&
    prevProps.liveAudioError === nextProps.liveAudioError &&
    prevProps.selectedPlan === nextProps.selectedPlan &&
    prevProps.isNewChat === nextProps.isNewChat &&
    prevProps.sidebarOpen === nextProps.sidebarOpen
  );
});