import React, { useState, useMemo, useCallback } from "react";
import { User, Bot, Clock, Copy, Sparkles, AlertCircle } from "./icons";
import { toast } from "react-hot-toast";

const ChatMessage = ({
  message,
  handleSuggestionClick,
  userProfile,
  isStreaming = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const enhanceEmojis = useCallback((content) => {
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
      content = content.replace(new RegExp(emoji, "g"), emojiMap[emoji]);
    });

    return content;
  }, []);

  const formatMessageContent = useCallback(
    (content) => {
      let formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white bg-blue-900/50 px-1 rounded">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
        .replace(/```([\s\S]*?)```/g, '<div class="bg-gray-900 rounded-lg p-4 my-3 overflow-x-auto border border-gray-200 shadow-sm"><pre class="text-green-400 text-sm font-mono leading-relaxed"><code>$1</code></pre></div>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-700 text-blue-300 px-2 py-1 rounded-md text-sm font-mono border border-gray-600">$1</code>')
        .replace(/^#{3}\s+(.*)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-white flex items-center"><span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>$1</h3>')
        .replace(/^#{2}\s+(.*)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3 text-white flex items-center"><span class="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>$1</h2>')
        .replace(/^#{1}\s+(.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-white flex items-center"><span class="w-4 h-4 bg-blue-700 rounded-full mr-2"></span>$1</h1>')
        .replace(/^[-•]\s+(.*)$/gm, '<li class="flex items-start mb-3 ml-2 group hover:translate-x-1 transition-transform duration-200"><span class="flex-shrink-0 w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mt-2 mr-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all"></span><span class="text-gray-200 leading-relaxed">$1</span></li>')
        .replace(/^(\d+)\.\s+(.*)$/gm, '<li class="flex items-start mb-3 ml-2 group hover:translate-x-1 transition-transform duration-200"><span class="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5 mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">$1</span><span class="text-gray-200 leading-relaxed">$2</span></li>')
        .replace(/💡\s*(.*?)(?=\n|$)/g, '<div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-yellow-600 mr-2">💡</span><span class="font-medium text-yellow-800">Tip:</span></div><p class="text-yellow-700 mt-1">$1</p></div>')
        .replace(/⚠️\s*(.*?)(?=\n|$)/g, '<div class="bg-orange-50 border-l-4 border-orange-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-orange-600 mr-2">⚠️</span><span class="font-medium text-orange-800">Warning:</span></div><p class="text-orange-700 mt-1">$1</p></div>')
        .replace(/ℹ️\s*(.*?)(?=\n|$)/g, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-blue-600 mr-2">ℹ️</span><span class="font-medium text-blue-800">Info:</span></div><p class="text-blue-700 mt-1">$1</p></div>')
        .replace(/✅\s*(.*?)(?=\n|$)/g, '<div class="bg-green-50 border-l-4 border-green-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-green-600 mr-2">✅</span><span class="font-medium text-green-800">Success:</span></div><p class="text-green-700 mt-1">$1</p></div>')
        .replace(/🏋️‍♂️\s*(.*?)(?=\n|$)/g, '<div class="bg-purple-50 border-l-4 border-purple-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-purple-600 mr-2">🏋️‍♂️</span><span class="font-medium text-purple-800">Workout:</span></div><p class="text-purple-700 mt-1">$1</p></div>')
        .replace(/🥗\s*(.*?)(?=\n|$)/g, '<div class="bg-green-50 border-l-4 border-green-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-green-600 mr-2">🥗</span><span class="font-medium text-green-800">Nutrition:</span></div><p class="text-green-700 mt-1">$1</p></div>')
        .replace(/🏃‍♂️\s*(.*?)(?=\n|$)/g, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3 rounded-r-lg"><div class="flex items-center"><span class="text-blue-600 mr-2">🏃‍♂️</span><span class="font-medium text-blue-800">Cardio:</span></div><p class="text-blue-700 mt-1">$1</p></div>')
        .replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-gray-700/50 italic text-gray-300 rounded-r-lg">$1</blockquote>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>')
        .replace(/\n/g, "<br>");

      formattedContent = formattedContent.replace(
        /(<li class="flex items-start mb-2 ml-2">.*?<\/li>)/g,
        (match) => `<ul class="space-y-1 my-3">${match}</ul>`
      );

      return enhanceEmojis(formattedContent);
    },
    [enhanceEmojis]
  );

  const formattedContent = useMemo(
    () => formatMessageContent(message.content || ""),
    [message.content, formatMessageContent]
  );

  const formatTime = useCallback((date) => {
    if (!date) return "";
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }, []);

  const getPersonalizedSuggestions = useMemo(() => {
    if (!message.suggestions) return [];

    let suggestions = [...message.suggestions];

    if (userProfile?.fitnessGoal === "weight-loss" && message.role === "ai") {
      suggestions = suggestions.map((suggestion) => {
        if (suggestion.includes("workout")) return "Best fat-burning workouts for me";
        if (suggestion.includes("diet") || suggestion.includes("meal")) return "Personalized meal plan for weight loss";
        return suggestion;
      });
    } else if (userProfile?.fitnessGoal === "muscle-gain" && message.role === "ai") {
      suggestions = suggestions.map((suggestion) => {
        if (suggestion.includes("workout")) return "Design my muscle-building routine";
        if (suggestion.includes("protein") || suggestion.includes("nutrition")) return "Calculate my protein requirements";
        return suggestion;
      });
    }

    return suggestions;
  }, [message.suggestions, message.role, userProfile?.fitnessGoal]);

  if (message.role === "ai") {
    return (
      <div className="flex justify-center w-full group">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-2xl text-left my-6 px-2 sm:px-0" style={{ background: "none", boxShadow: "none", border: "none", padding: 0 }}>
            <div
              className="text-[16px] leading-[1.7] font-normal tracking-wide text-white"
              style={{
                fontFamily:
                  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: "0.01em",
              }}
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />

            {isStreaming && !message.content && (
              <span className="inline-flex items-center ml-1 space-x-1">
                <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}

            {!isStreaming && getPersonalizedSuggestions.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="group flex items-center space-x-2 px-3 py-1.5 text-blue-400 text-xs md:text-sm rounded-lg border border-gray-700 transition-all duration-200 bg-transparent hover:bg-gray-800/40"
                >
                  <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span className="font-medium">
                    {showSuggestions ? "Hide" : "Show"} follow-up suggestions
                  </span>
                  <span className="text-[10px] md:text-xs bg-blue-900/50 px-1.5 py-0.5 rounded-full text-blue-300">
                    {getPersonalizedSuggestions.length}
                  </span>
                </button>

                {showSuggestions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getPersonalizedSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSuggestionClick(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="px-3 py-2 bg-gray-800/60 text-blue-400 text-xs md:text-sm rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end group">
      <div className="max-w-[85%] order-2">
        <div className="text-right">
          <div className="inline-block p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="prose prose-sm max-w-none prose-invert">
              <div
                className="text-[15px] leading-[1.6] font-normal tracking-wide"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  lineHeight: "1.6",
                  letterSpacing: "0.01em",
                }}
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
            </div>
          </div>

          {!isStreaming && (
            <div className="flex items-center mt-2 md:mt-3 space-x-1.5 md:space-x-2 text-[10px] md:text-xs text-gray-500 justify-end">
              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span className="font-medium">{formatTime(message.timestamp)}</span>
              <button
                onClick={() => copyToClipboard(message.content)}
                className="p-1 md:p-1.5 hover:bg-gray-700 rounded-md md:rounded-lg transition-colors duration-200 ml-2 md:ml-3 cursor-pointer"
                title="Copy message"
              >
                <Copy className="h-2.5 w-2.5 md:h-3 md:w-3 hover:text-blue-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.userProfile?.name === nextProps.userProfile?.name
  );
});
