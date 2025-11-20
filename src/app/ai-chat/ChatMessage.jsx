import React, { useState, useEffect } from "react";
import {
  User,
  Bot,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Sparkles,
  AlertCircle,
  Zap,
  Target,
  Trophy,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const ChatMessage = ({ 
  message, 
  handleSuggestionClick, 
  userProfile,
  isStreaming = false, // New prop to indicate if this message is currently streaming
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const formatMessageContent = (content) => {
    // Convert markdown-style formatting to HTML with enhanced styling
    let formattedContent = content
      // Bold text with enhanced styling
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">$1</strong>'
      )
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      // Code blocks with syntax highlighting effect
      .replace(
        /```([\s\S]*?)```/g,
        '<div class="bg-gray-900 rounded-lg p-4 my-3 overflow-x-auto border border-gray-200 shadow-sm"><pre class="text-green-400 text-sm font-mono leading-relaxed"><code>$1</code></pre></div>'
      )
      // Inline code with better styling
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-mono border border-gray-200">$1</code>'
      )
      // Enhanced headers with icons and styling
      .replace(
        /^#{3}\s+(.*)$/gm,
        '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800 flex items-center"><span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>$1</h3>'
      )
      .replace(
        /^#{2}\s+(.*)$/gm,
        '<h2 class="text-xl font-semibold mt-6 mb-3 text-gray-800 flex items-center"><span class="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>$1</h2>'
      )
      .replace(
        /^#{1}\s+(.*)$/gm,
        '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900 flex items-center"><span class="w-4 h-4 bg-blue-700 rounded-full mr-2"></span>$1</h1>'
      )
      // Enhanced bullet points with custom icons
      .replace(
        /^[-•]\s+(.*)$/gm,
        '<li class="flex items-start mb-2 ml-2"><span class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span><span class="text-gray-700">$1</span></li>'
      )
      // Enhanced numbered lists
      .replace(
        /^(\d+)\.\s+(.*)$/gm,
        '<li class="flex items-start mb-2 ml-2"><span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center justify-center mt-0.5 mr-3">$1</span><span class="text-gray-700">$2</span></li>'
      )
      // Special formatting for tips and notes
      .replace(
        /💡\s*(.*?)(?=\n|$)/g,
        '<div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-yellow-600 mr-2">💡</span><span class="font-medium text-yellow-800">Tip:</span></div><p class="text-yellow-700 mt-1">$1</p></div>'
      )
      .replace(
        /⚠️\s*(.*?)(?=\n|$)/g,
        '<div class="bg-orange-50 border-l-4 border-orange-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-orange-600 mr-2">⚠️</span><span class="font-medium text-orange-800">Warning:</span></div><p class="text-orange-700 mt-1">$1</p></div>'
      )
      .replace(
        /ℹ️\s*(.*?)(?=\n|$)/g,
        '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-blue-600 mr-2">ℹ️</span><span class="font-medium text-blue-800">Info:</span></div><p class="text-blue-700 mt-1">$1</p></div>'
      )
      .replace(
        /✅\s*(.*?)(?=\n|$)/g,
        '<div class="bg-green-50 border-l-4 border-green-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-green-600 mr-2">✅</span><span class="font-medium text-green-800">Success:</span></div><p class="text-green-700 mt-1">$1</p></div>'
      )
      // Enhanced fitness/workout specific formatting
      .replace(
        /🏋️‍♂️\s*(.*?)(?=\n|$)/g,
        '<div class="bg-purple-50 border-l-4 border-purple-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-purple-600 mr-2">🏋️‍♂️</span><span class="font-medium text-purple-800">Workout:</span></div><p class="text-purple-700 mt-1">$1</p></div>'
      )
      .replace(
        /🥗\s*(.*?)(?=\n|$)/g,
        '<div class="bg-green-50 border-l-4 border-green-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-green-600 mr-2">🥗</span><span class="font-medium text-green-800">Nutrition:</span></div><p class="text-green-700 mt-1">$1</p></div>'
      )
      .replace(
        /🏃‍♂️\s*(.*?)(?=\n|$)/g,
        '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-blue-600 mr-2">🏃‍♂️</span><span class="font-medium text-blue-800">Cardio:</span></div><p class="text-blue-700 mt-1">$1</p></div>'
      )
      // Quote blocks
      .replace(
        /^>\s+(.*)$/gm,
        '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-3 bg-gray-50 italic text-gray-600 rounded-r-lg">$1</blockquote>'
      )
      // Enhanced links (if any)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // Highlight important words
      .replace(
        /==(.*?)==/g,
        '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
      )
      // Line breaks
      .replace(/\n/g, "<br>");

    // Wrap lists in proper containers
    formattedContent = formattedContent.replace(
      /(<li class="flex items-start mb-2 ml-2">.*?<\/li>)/g,
      (match) => {
        if (match.includes("numbered")) {
          return match;
        }
        return `<ul class="space-y-1 my-3">${match}</ul>`;
      }
    );

    // Add emoji enhancement
    formattedContent = enhanceEmojis(formattedContent);

    return formattedContent;
  };

  const enhanceEmojis = (content) => {
    const emojiMap = {
      "💪": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">💪</span>',
      "🔥": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">🔥</span>',
      "⚡": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">⚡</span>',
      "🎯": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">🎯</span>',
      "🏆": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">🏆</span>',
      "⭐": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">⭐</span>',
      "🚀": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">🚀</span>',
      "✨": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">✨</span>',
      "❤️": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">❤️</span>',
      "👍": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">👍</span>',
      "🎉": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">🎉</span>',
      "💯": '<span class="text-lg inline-block transform hover:scale-110 transition-transform duration-200">💯</span>',
    };

    Object.keys(emojiMap).forEach((emoji) => {
      const regex = new RegExp(emoji, "g");
      content = content.replace(regex, emojiMap[emoji]);
    });

    return content;
  };

  const formatTime = (date) => {
    if (!date) return ""; // handle undefined/null

    // Ensure we always work with a Date object
    const parsedDate = date instanceof Date ? date : new Date(date);

    // Check if parsedDate is valid
    if (isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getPersonalizedAvatar = () => {
    if (message.role === "user") {
      if (userProfile?.name) {
        return (
          <div className="flex-shrink-0 w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md md:shadow-lg text-white text-xs md:text-base font-bold ring-1 md:ring-2 ring-white">
            {userProfile.name.charAt(0).toUpperCase()}
          </div>
        );
      }
      return (
        <div className="flex-shrink-0 w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md md:shadow-lg ring-1 md:ring-2 ring-white">
          <User className="h-3.5 w-3.5 md:h-5 md:w-5 text-white" />
        </div>
      );
    }

    return (
      <div
        className={`flex-shrink-0 w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-md md:shadow-lg ring-1 md:ring-2 ring-white ${
          message.isError
            ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white"
            : "bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white"
        }`}
      >
        {message.isError ? (
          <AlertCircle className="h-3.5 w-3.5 md:h-5 md:w-5" />
        ) : (
          <Bot className="h-3.5 w-3.5 md:h-5 md:w-5" />
        )}
      </div>
    );
  };

  const getPersonalizedSuggestions = () => {
    if (!message.suggestions) return [];

    // Add personalized suggestions based on user profile
    let suggestions = [...message.suggestions];

    if (userProfile?.fitnessGoal === "weight-loss" && message.role === "ai") {
      suggestions = suggestions.map((suggestion) => {
        if (suggestion.includes("workout")) {
          return "Best fat-burning workouts for me";
        }
        if (suggestion.includes("diet") || suggestion.includes("meal")) {
          return "Personalized meal plan for weight loss";
        }
        return suggestion;
      });
    } else if (
      userProfile?.fitnessGoal === "muscle-gain" &&
      message.role === "ai"
    ) {
      suggestions = suggestions.map((suggestion) => {
        if (suggestion.includes("workout")) {
          return "Design my muscle-building routine";
        }
        if (
          suggestion.includes("protein") ||
          suggestion.includes("nutrition")
        ) {
          return "Calculate my protein requirements";
        }
        return suggestion;
      });
    }

    return suggestions;
  };

  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      } group`}
    >
      <div
        className={`max-w-[85%] ${
          message.role === "user" ? "order-2" : "order-1"
        }`}
      >
        <div className={`${message.role === "user" ? "text-right" : "text-left"}`}>
            {/* Message Content */}
            <div
              className={`inline-block p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm transition-all duration-300 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : message.isError
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "bg-white text-gray-800 border border-gray-100 shadow-md"
              }`}
            >
              <div
                className={`prose prose-sm max-w-none ${
                  message.role === "user" ? "prose-invert" : "prose-gray"
                }`}
              >
                <div
                  className="text-[15px] leading-[1.6] font-normal tracking-wide"
                  style={{
                    fontFamily:
                      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    lineHeight: "1.6",
                    letterSpacing: "0.01em",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(message.content),
                  }}
                />
                
                {/* Streaming cursor indicator - Three dots like ChatGPT, only show when no content yet */}
                {isStreaming && message.role === "ai" && !message.content && (
                  <span className="inline-flex items-center ml-1 space-x-1">
                    <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                )}
              </div>

              {/* AI Enhancement Indicator - Only show when NOT streaming */}
              {!isStreaming && message.role === "ai" && !message.isError && message.content && (
                <div className="flex items-center mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-100 text-[10px] md:text-xs text-gray-500">
                  <div className="flex items-center space-x-1.5 md:space-x-2">
                    <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 text-blue-500" />
                    <span className="font-medium">
                      Personalized for {userProfile?.name || "you"}
                    </span>
                    <div className="hidden md:flex items-center space-x-1 ml-2">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <Target className="h-3 w-3 text-green-500" />
                      <Trophy className="h-3 w-3 text-purple-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Actions - Only show when NOT streaming */}
            {!isStreaming && (
              <div
                className={`flex items-center mt-2 md:mt-3 space-x-1.5 md:space-x-2 text-[10px] md:text-xs text-gray-400 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span className="font-medium">
                  {formatTime(message.timestamp)}
                </span>
                {message.role === "ai" && !message.isError && (
                  <div className="flex items-center space-x-0.5 md:space-x-1 ml-2 md:ml-3">
                    <button
                      className="p-1 md:p-1.5 hover:bg-gray-100 rounded-md md:rounded-lg transition-colors duration-200"
                      title="Helpful response"
                    >
                      <ThumbsUp className="h-2.5 w-2.5 md:h-3 md:w-3 hover:text-green-600" />
                    </button>
                    <button
                      className="p-1 md:p-1.5 hover:bg-gray-100 rounded-md md:rounded-lg transition-colors duration-200"
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-2.5 w-2.5 md:h-3 md:w-3 hover:text-red-500" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="p-1 md:p-1.5 hover:bg-gray-100 rounded-md md:rounded-lg transition-colors duration-200"
                      title="Copy message"
                    >
                      <Copy className="h-2.5 w-2.5 md:h-3 md:w-3 hover:text-blue-500" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Personalized AI Suggestions - Only show when NOT streaming and has suggestions */}
            {!isStreaming &&
              message.role === "ai" &&
              getPersonalizedSuggestions().length > 0 && (
                <div className="mt-3 md:mt-4">
                  {/* Toggle Button */}
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="group flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-xs md:text-sm rounded-lg border border-blue-200/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span className="font-medium">
                      {showSuggestions ? "Hide" : "Show"} follow-up suggestions
                    </span>
                    <span className="text-[10px] md:text-xs bg-blue-200/50 px-1.5 py-0.5 rounded-full">
                      {getPersonalizedSuggestions().length}
                    </span>
                    <svg
                      className={`h-3 w-3 transition-transform duration-200 ${
                        showSuggestions ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Suggestions List with smooth transition */}
                  {showSuggestions && (
                    <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {getPersonalizedSuggestions().map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleSuggestionClick(suggestion);
                              setShowSuggestions(false); // Auto-hide after selection
                            }}
                            className="group relative px-2.5 py-1.5 md:px-4 md:py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs md:text-sm rounded-lg md:rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-200/50 shadow-sm hover:shadow-md active:scale-95 md:hover:-translate-y-0.5 md:hover:scale-[1.02] font-medium overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/5 group-hover:to-indigo-400/5 transition-all duration-300"></div>
                            <div className="relative flex items-center space-x-1">
                              <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
                              <span className="group-hover:font-semibold transition-all duration-200 line-clamp-1">
                                {suggestion}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
