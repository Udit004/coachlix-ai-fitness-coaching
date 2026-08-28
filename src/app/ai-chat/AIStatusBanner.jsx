import React, { useRef } from "react";
import { useStatusBannerAnimation } from "../../hooks/useChatAnimations";

const GenerationIndicator = ({ small = false }) => (
  <div className="flex-shrink-0 flex items-center justify-center gap-0.5">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={`bg-blue-400 rounded-sm animate-[gen-pulse_1.2s_ease-in-out_infinite] ${
          small ? "w-0.5 h-2" : "w-0.5 h-3.5"
        }`}
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

const AIStatusBanner = ({ status }) => {
  const bannerRef = useRef(null);
  const statusKey = `${status?.type}|${status?.label}|${status?.tool}|${status?.intent}|${status?.startedAt}`;
  useStatusBannerAnimation(bannerRef, statusKey);

  if (!status) return null;

  const { type = "", label, tool, intent } = status;
  const isStreaming = type.includes("token.streamed");

  if (isStreaming) return null;

  const displayText = tool
    ? `Using tool: ${tool}`
    : intent
      ? `Goal: ${intent}`
      : label || "Processing...";

  return (
    <div
      ref={bannerRef}
      className="flex items-center gap-2 px-2 pl-6 text-xs sm:text-sm text-gray-300"
      style={{ opacity: 1, transform: "none" }}
    >
      <GenerationIndicator />
      <span className="truncate font-medium">{displayText}</span>
    </div>
  );
};

export { GenerationIndicator };

export default React.memo(
  AIStatusBanner,
  (prev, next) =>
    prev.status?.type === next.status?.type &&
    prev.status?.label === next.status?.label &&
    prev.status?.tool === next.status?.tool &&
    prev.status?.intent === next.status?.intent &&
    prev.status?.startedAt === next.status?.startedAt
);
