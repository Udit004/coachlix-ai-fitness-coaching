// src/ai/graph/fitness/nodes/greetingNode.js

import { AIMessage } from "@langchain/core/messages";
import { getGreetingResponse } from "../../../reasoning/intentRouter.js";

export async function greetingNode(state) {
  const { originalMessage, profile } = state;
  const t0 = Date.now();

  const response = getGreetingResponse(originalMessage ?? "", profile?.username);
  const aiMessage = new AIMessage({ content: response });

  console.log(
    `[Graph:greeting] Template response returned in ${Date.now() - t0} ms - LLM bypassed`
  );

  return {
    messages: [aiMessage],
    flowMetrics: { greetingResponseTime: Date.now() - t0 },
  };
}
