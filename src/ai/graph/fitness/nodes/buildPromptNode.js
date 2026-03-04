// src/ai/graph/fitness/nodes/buildPromptNode.js

import { selectPrompt } from "../../../prompts/selectPrompt.js";
import { buildChatHistory, buildInitialMessages } from "../../../streaming/messageBuilder.js";
import {
  buildMultimodalContent,
  isMultimodalContent,
} from "../../../multimodal/contentBuilder.js";
import {
  injectRelevantProfileFields,
  shouldSkipHistory,
} from "../policies.js";

export async function buildPromptNode(state) {
  const {
    originalMessage,
    files,
    intent,
    userContext,
    conversationHistory,
    userId,
    profile,
  } = state;

  const contextWithProfile = injectRelevantProfileFields(userContext, profile);

  if (contextWithProfile?.profile?._profileSummary) {
    const fields = ["fitnessGoal", "experience", "activityLevel"].filter(
      (f) => contextWithProfile.profile[f]
    );
    console.log(`[Graph:prompt] Profile injected - fields: ${fields.join(", ")}`);
  }

  const { systemPrompt, promptTier } = selectPrompt({
    intent,
    userContext: contextWithProfile,
    userId,
  });
  console.log(`[Graph:prompt] ${promptTier} prompt selected`);

  const chatHistory = buildChatHistory(conversationHistory);
  const filteredHistory = shouldSkipHistory(intent) ? [] : chatHistory;

  if (chatHistory.length > 0 && filteredHistory.length === 0) {
    console.log(
      `[Graph:prompt] Chat history SKIPPED for intent "${intent.intent}" ` +
        `(saved ~${chatHistory.length * 50} tokens)`
    );
  }

  let userContent;
  if (isMultimodalContent(files)) {
    console.log("[Graph:prompt] Building multimodal content (text + files)...");
    userContent = await buildMultimodalContent(originalMessage, files);
  } else {
    userContent = originalMessage;
  }

  const messages = buildInitialMessages(systemPrompt, filteredHistory, userContent);
  console.log(`[Graph:prompt] ${messages.length} messages assembled`);

  return { messages, userContext: contextWithProfile };
}
