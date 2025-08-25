import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import StreamingMessage from "./StreamingMessage";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

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
}) => {
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => {
          // Check if this message is currently streaming
          const isStreaming = message.id === streamingMessageId;
          
          if (isStreaming && message.role === "ai") {
            return (
              <StreamingMessage
                key={message.id ?? `message-${index}`}
                message={message}
                handleSuggestionClick={handleSuggestionClick}
                userProfile={userProfile}
                isStreaming={true}
                streamingContent={streamingContent}
                onStreamingComplete={onStreamingComplete}
              />
            );
          }
          
          return (
            <ChatMessage
              key={message.id ?? `message-${index}`}
              message={message}
              handleSuggestionClick={handleSuggestionClick}
              userProfile={userProfile}
              formatTime={formatTime}
              copyToClipboard={copyToClipboard}
            />
          );
        })}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator userProfile={userProfile} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="border-t border-gray-100 p-2 sm:p-4 bg-white rounded-b-lg sm:rounded-b-xl">
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
    </div>
  );
};

export default ChatContainer;
