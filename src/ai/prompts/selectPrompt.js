// src/ai/prompts/selectPrompt.js

import { generateSmartPrompt } from "./ultraOptimizedPromptBuilder.js";
import { generateOptimizedSystemPrompt } from "./dynamicPromptBuilder.js";

export function selectPrompt({ intent, userContext, userId, reasoning = null }) {
  if (intent?.version === "v2" && intent.confidence >= 0.6) {
    return {
      systemPrompt: generateSmartPrompt(intent, userContext, userId),
      promptTier: "ULTRA-OPTIMIZED",
    };
  }

  return {
    systemPrompt: generateOptimizedSystemPrompt(intent, userContext, userId, reasoning),
    promptTier: "DYNAMIC",
  };
}
