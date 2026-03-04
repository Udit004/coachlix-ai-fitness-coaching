// src/ai/graph/fitness/nodes/llmNode.js

import { QueryType } from "../../../reasoning/intentRouter.js";
import { createStreamingLLM, createLLMWithSearch } from "../../../config/llmconfig.js";
import { getSearchGroundingConfig } from "../../../config/searchGrounding.js";
import { createGraphTools } from "../tools/index.js";
import { getExcludedTools } from "../policies.js";

export async function llmNode(state) {
  const { messages, enableSearch, queryType, intent, userContext } = state;

  if (queryType === QueryType.GENERAL_FITNESS) {
    console.log("[Graph:llm] GENERAL path - personal tools excluded");
  }

  const excludedTools = getExcludedTools({
    enableSearch,
    queryType,
    intent,
    userContext,
  });

  if (intent?.intent === "plan_modification" && excludedTools.includes("fetch_details")) {
    console.log("[Graph:llm] plan_modification - fetch_details excluded (planId preloaded)");
  }

  if (
    intent?.intent === "plan_modification" &&
    excludedTools.includes("nutrition_lookup") &&
    !enableSearch
  ) {
    console.log(
      "[Graph:llm] plan_modification - nutrition_lookup excluded (all foods preloaded)"
    );
  }

  const tools = createGraphTools(excludedTools);

  let llm;
  if (enableSearch) {
    const searchConfig = getSearchGroundingConfig({ threshold: 0.7 });
    llm = createLLMWithSearch(true, searchConfig);
    console.log("[Graph:llm] Using Gemini + Google Search grounding");
  } else {
    llm = createStreamingLLM(true);
    console.log("[Graph:llm] Using standard Gemini 2.5 Flash");
  }

  const llmWithTools = llm.bindTools(tools);

  console.log(
    `[Graph:llm] Invoking - ${tools.length} tools bound, ${messages.length} messages`
  );

  const response = await llmWithTools.invoke(messages);

  const toolCallCount = response.tool_calls?.length ?? 0;
  if (toolCallCount > 0) {
    const names = response.tool_calls.map((tc) => tc.name).join(", ");
    console.log(`[Graph:llm] -> Requesting tools: ${names}`);
  } else {
    const chars =
      typeof response.content === "string"
        ? response.content.length
        : JSON.stringify(response.content ?? "").length;
    console.log(`[Graph:llm] -> Final response generated (${chars} chars)`);
  }

  return { messages: [response] };
}
