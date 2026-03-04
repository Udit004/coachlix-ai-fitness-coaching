// src/ai/graph/fitness/nodes/buildSimplePromptNode.js

import {
  buildMultimodalContent,
  isMultimodalContent,
} from "../../../multimodal/contentBuilder.js";
import { buildInitialMessages } from "../../../streaming/messageBuilder.js";

export async function buildSimplePromptNode(state) {
  const { originalMessage, files, intent } = state;

  const systemPrompt =
    "You are Coachlix, a knowledgeable and encouraging AI fitness coach. " +
    "Answer clearly and concisely. Do not ask for personal data unless the " +
    "user explicitly provides it.";

  let userContent;
  if (isMultimodalContent(files)) {
    console.log("[Graph:simplePrompt] Building multimodal content...");
    userContent = await buildMultimodalContent(originalMessage, files);
  } else {
    userContent = originalMessage;
  }

  const messages = buildInitialMessages(systemPrompt, [], userContent);
  console.log(
    `[Graph:simplePrompt] Profile-free prompt built for "${intent?.intent}" ` +
      `(${messages.length} msg - no RAG, no profile, no history)`
  );

  return { messages };
}
