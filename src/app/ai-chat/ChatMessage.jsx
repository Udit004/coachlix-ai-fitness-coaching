import React, { useState, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, Clock, Copy, Sparkles, AlertCircle, ChevronDown } from "./icons";
import { GenerationIndicator } from "./AIStatusBanner";
import AiAvatar from "./AiAvatar";
import { toast } from "react-hot-toast";

// ── YouTube embed helpers ──────────────────────────────────────────────────
const YOUTUBE_URL_RE =
  /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]{11}|youtube\.com\/shorts\/[\w-]{11}|youtube\.com\/embed\/[\w-]{11}|youtu\.be\/[\w-]{11}))/i;

function extractYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = String(url || "").match(p);
    if (m) return m[1];
  }
  return null;
}

const YouTubeEmbed = ({ url }) => {
  const [active, setActive] = useState(false);
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className="my-3">
      {active ? (
        <div className="rounded-xl overflow-hidden border border-gray-700 shadow-lg bg-black">
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-gray-900/60 hover:bg-gray-800/80 active:bg-gray-800/60 transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white shadow-md group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-white">▶ Play video in app</span>
            <span className="block text-xs text-gray-400 truncate">{url}</span>
          </span>
        </button>
      )}
    </div>
  );
};

// ── Markdown rendering ──────────────────────────────────────────────────────

// Emojis that trigger a full callout box when they lead a paragraph
const EMOJI_CALLOUTS = {
  "💡": { border: "border-yellow-400", bg: "bg-yellow-50", head: "text-yellow-800", body: "text-yellow-700", label: "Tip" },
  "⚠️": { border: "border-orange-400", bg: "bg-orange-50", head: "text-orange-800", body: "text-orange-700", label: "Warning" },
  "ℹ️": { border: "border-blue-400", bg: "bg-blue-50", head: "text-blue-800", body: "text-blue-700", label: "Info" },
  "✅": { border: "border-green-400", bg: "bg-green-50", head: "text-green-800", body: "text-green-700", label: "Success" },
  "🏋️‍♂️": { border: "border-purple-400", bg: "bg-purple-50", head: "text-purple-800", body: "text-purple-700", label: "Workout" },
  "🥗": { border: "border-green-400", bg: "bg-green-50", head: "text-green-800", body: "text-green-700", label: "Nutrition" },
  "🏃‍♂️": { border: "border-blue-400", bg: "bg-blue-50", head: "text-blue-800", body: "text-blue-700", label: "Cardio" },
};

// Emojis that just get a hover-scale treatment wherever they appear
const HOVER_EMOJIS = ["💪", "🔥", "⚡", "🎯", "🏆", "⭐", "🚀", "✨", "❤️", "👍", "🎉", "💯"];
const HOVER_EMOJI_RE = new RegExp(`(${HOVER_EMOJIS.join("|")})`, "g");

// Wraps hover-emojis found inside a children tree with an animated span.
// Only touches plain string children; leaves elements (links, bold, etc.) untouched.
function withEmojiHover(children) {
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts = child.split(HOVER_EMOJI_RE);
    if (parts.length === 1) return child;
    return parts.map((part, i) =>
      HOVER_EMOJIS.includes(part) ? (
        <span key={i} className="text-lg inline-block transform hover:scale-110 transition-transform duration-200">
          {part}
        </span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  });
}

function getFirstString(children) {
  const arr = React.Children.toArray(children);
  return typeof arr[0] === "string" ? arr[0] : "";
}

const markdownComponents = {
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-gray-700/50">
      <table className="w-full border-collapse text-sm text-gray-300">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-800/60">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="odd:bg-gray-800/20 even:bg-gray-800/40 hover:bg-gray-700/40 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left text-xs font-semibold text-blue-400 bg-gray-800/70 border-b-2 border-gray-700 whitespace-nowrap">
      {withEmojiHover(children)}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 border-b border-gray-700/50 text-gray-300 text-sm align-top">
      {withEmojiHover(children)}
    </td>
  ),

  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 text-white flex items-center">
      <span className="w-4 h-4 bg-blue-700 rounded-full mr-2" />
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold mt-6 mb-3 text-white flex items-center">
      <span className="w-3 h-3 bg-blue-600 rounded-full mr-2" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-6 mb-3 text-white flex items-center">
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
      {children}
    </h3>
  ),

  p: ({ children }) => {
    const text = getFirstString(children);
    const emojiKey = Object.keys(EMOJI_CALLOUTS).find((e) => text.startsWith(e));
    if (emojiKey) {
      const style = EMOJI_CALLOUTS[emojiKey];
      const rest = React.Children.toArray(children);
      if (typeof rest[0] === "string") rest[0] = rest[0].slice(emojiKey.length).trimStart();
      return (
        <div className={`${style.bg} border-l-4 ${style.border} p-3 my-3 rounded-r-lg`}>
          <div className="flex items-center">
            <span className="mr-2">{emojiKey}</span>
            <span className={`font-medium ${style.head}`}>{style.label}:</span>
          </div>
          <p className={`${style.body} mt-1`}>{withEmojiHover(rest)}</p>
        </div>
      );
    }
    return <p className="mb-2 leading-relaxed">{withEmojiHover(children)}</p>;
  },

  ul: ({ children }) => <ul className="space-y-1 my-3 list-none">{children}</ul>,
  ol: ({ children }) => <ol className="space-y-1 my-3 list-none">{children}</ol>,
  li: ({ children, ordered, index }) => (
    <li className="flex items-start mb-3 ml-2 group hover:translate-x-1 transition-transform duration-200">
      {ordered ? (
        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5 mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
          {index + 1}
        </span>
      ) : (
        <span className="flex-shrink-0 w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mt-2 mr-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all" />
      )}
      <span className="text-gray-200 leading-relaxed">{withEmojiHover(children)}</span>
    </li>
  ),

  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-gray-700/50 italic text-gray-300 rounded-r-lg">
      {children}
    </blockquote>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-white bg-blue-900/50 px-1 rounded">{withEmojiHover(children)}</strong>
  ),
  em: ({ children }) => <em className="italic text-gray-300">{children}</em>,

  pre: ({ children }) => (
    <div className="bg-gray-900 rounded-lg p-4 my-3 overflow-x-auto border border-gray-700 shadow-sm">
      <pre className="text-green-400 text-sm font-mono leading-relaxed">{children}</pre>
    </div>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className="font-mono">{children}</code>
    ) : (
      <code className="bg-gray-700 text-blue-300 px-2 py-1 rounded-md text-sm font-mono border border-gray-600">
        {children}
      </code>
    ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors duration-200 break-all"
    >
      {children}
    </a>
  ),

  del: ({ children }) => <del className="text-gray-500">{children}</del>,
};

// Reused for AI messages, the "thinking process" panel, and user bubbles.
const Markdown = ({ content }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
    {content || ""}
  </ReactMarkdown>
);

const ChatMessage = ({
  message,
  handleSuggestionClick,
  userProfile,
  isStreaming = false,
  aiStatus = null,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showThought, setShowThought] = useState(false);

  if (!message) return null;

  // Collect distinct YouTube URLs from the raw assistant content so we can
  // render an inline player for each, in addition to the clickable link
  // ReactMarkdown already renders for bare URLs (autolink via remark-gfm).
  const youtubeUrls = useMemo(() => {
    if (message.role !== "ai") return [];
    const found = [];
    const seen = new Set();
    const text = message.content || "";
    let m;
    const re = new RegExp(YOUTUBE_URL_RE.source, "gi");
    while ((m = re.exec(text)) !== null) {
      const url = m[1];
      if (!seen.has(url)) {
        seen.add(url);
        found.push(url);
      }
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return found;
  }, [message.content, message.role]);

  const formatTime = useCallback((date) => {
    if (!date) return "";
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return "";
    return parsedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
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

            {/* Top Bar for AI message: Status + Generation Indicator + Thought Toggle */}
            {(isStreaming || message.thoughtContent || !isStreaming) && (
              <div className="flex items-center gap-2 mb-2">
                {isStreaming && (
                  <div className="inline-flex items-center h-4">
                    <GenerationIndicator small />
                  </div>
                )}
                {isStreaming && aiStatus?.label && (
                  <span className="text-xs sm:text-sm font-medium text-blue-400 animate-pulse truncate max-w-[200px] sm:max-w-[300px]">
                    {aiStatus.tool ? `Using tool: ${aiStatus.tool}` : aiStatus.intent ? `Goal: ${aiStatus.intent}` : aiStatus.label}
                  </span>
                )}

                {!isStreaming && <AiAvatar size={28} />}

                {message.thoughtContent && (
                  <button
                    onClick={() => setShowThought(!showThought)}
                    className="p-1 rounded bg-gray-800/40 hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    title="Toggle AI Thinking Process"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showThought ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            )}

            {/* Thought Content Dropdown */}
            {message.thoughtContent && showThought && (
              <div className="mb-4 px-4 py-3 text-[14px] leading-relaxed text-gray-400 border border-gray-700/50 rounded-lg bg-gray-900/20 break-words shadow-inner">
                <Markdown content={message.thoughtContent} />
              </div>
            )}

            <div
              className="text-[16px] leading-[1.7] font-normal tracking-wide text-white break-words"
              style={{
                fontFamily:
                  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: "0.01em",
              }}
            >
              <Markdown content={message.content} />
            </div>

            {/* Inline YouTube players for any video links the coach shared */}
            {!isStreaming &&
              youtubeUrls.map((url, idx) => (
                <YouTubeEmbed key={`yt-${idx}`} url={url} />
              ))}

            {!isStreaming && getPersonalizedSuggestions.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="group flex items-center space-x-2 min-h-[36px] px-3 py-1.5 text-blue-400 text-xs md:text-sm rounded-lg border border-gray-700 transition-all duration-200 bg-transparent hover:bg-gray-800/40 active:bg-gray-800/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                        className="min-h-[36px] px-3 py-2 bg-gray-800/60 text-blue-400 text-xs md:text-sm rounded-lg border border-gray-700 hover:bg-gray-700 active:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
      <div className="max-w-[85%] md:max-w-[70%] lg:max-w-2xl order-2">
        <div className="text-right">
          <div className="inline-block p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="prose prose-sm max-w-none prose-invert">
              <div
                className="text-[15px] leading-[1.6] font-normal tracking-wide break-words text-left"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  lineHeight: "1.6",
                  letterSpacing: "0.01em",
                }}
              >
                <Markdown content={message.content} />
              </div>
            </div>
          </div>

          {!isStreaming && (
            <div className="flex items-center mt-2 md:mt-3 space-x-1.5 md:space-x-2 text-[10px] md:text-xs text-gray-500 justify-end">
              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span className="font-medium">{formatTime(message.timestamp)}</span>
              <button
                onClick={() => copyToClipboard(message.content)}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1 md:p-1.5 hover:bg-gray-700 active:bg-gray-600 rounded-md md:rounded-lg transition-colors duration-200 ml-2 md:ml-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
    prevProps.message?.id === nextProps.message?.id &&
    prevProps.message?.content === nextProps.message?.content &&
    prevProps.message?.thoughtContent === nextProps.message?.thoughtContent &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.userProfile?.name === nextProps.userProfile?.name
  );
});