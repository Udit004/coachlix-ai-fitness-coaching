// src/ai/graph/fitness/nodes/directGeneralNode.js

import { AIMessage } from "@langchain/core/messages";

export async function directGeneralNode(state) {
  const response = state.intent?.classifierResponse?.trim();

  console.log(
    `[Graph:directGeneral] Returning ${response ? "classifier" : "fallback"} response`
  );

  return {
    messages: [
      new AIMessage({
        content:
          response ||
          "I can answer that, but I need a moment to process it. Please try again.",
      }),
    ],
  };
}