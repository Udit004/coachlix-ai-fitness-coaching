// src/ai/graph/fitness/nodes/llmNode.js

import { AIMessage } from "@langchain/core/messages";
import { QueryType } from "../../../reasoning/intentRouter.js";
import { createStreamingLLM, createLLMWithSearch } from "../../../config/llmconfig.js";
import { getSearchGroundingConfig } from "../../../config/searchGrounding.js";
import { createGraphTools } from "../tools/index.js";
import { getExcludedTools } from "../policies.js";

function isStreamParseError(error) {
  const text = String(error?.message || error || "").toLowerCase();
  return text.includes("failed to parse stream");
}

function logResponseSummary(response) {
  const toolCallCount = response.tool_calls?.length ?? 0;
  if (toolCallCount > 0) {
    const names = response.tool_calls.map((tc) => tc.name).join(", ");
    console.log(`[Graph:llm] -> Requesting tools: ${names}`);
    return;
  }

  const chars =
    typeof response.content === "string"
      ? response.content.length
      : JSON.stringify(response.content ?? "").length;
  console.log(`[Graph:llm] -> Final response generated (${chars} chars)`);
}

export async function llmNode(state) {
  const { messages, enableSearch, queryType, intent, userContext } = state;

  const isGeneralPath = queryType === QueryType.GENERAL_FITNESS;

  if (isGeneralPath) {
    console.log("[Graph:llm] GENERAL path - direct small-LLM answer (no tools)");
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

  let tools = [];
  let llm;
  let runner;

  if (isGeneralPath) {
    llm = createStreamingLLM(true, {
      model:
        process.env.GENERAL_QUERY_MODEL?.trim() ||
        process.env.INTENT_CLASSIFIER_MODEL?.trim() ||
        "gemini-2.0-flash",
      temperature: 0.2,
      maxRetries: 0,
    });
    runner = llm;
    console.log("[Graph:llm] Using small model for GENERAL path");
  } else {
    tools = createGraphTools(excludedTools);

    if (enableSearch) {
      const searchConfig = getSearchGroundingConfig({ threshold: 0.7 });
      llm = createLLMWithSearch(true, searchConfig);
      console.log("[Graph:llm] Using Gemini + Google Search grounding");
    } else {
      llm = createStreamingLLM(true);
      console.log("[Graph:llm] Using standard Gemini 2.5 Flash");
    }

    runner = llm.bindTools(tools);
  }

  console.log(`[Graph:llm] Invoking - ${tools.length} tools bound, ${messages.length} messages`);

  try {
    const response = await runner.invoke(messages);
    logResponseSummary(response);
    return { messages: [response] };
  } catch (error) {
    if (!isStreamParseError(error)) {
      throw error;
    }

    console.warn("[Graph:llm] Stream parse failed. Retrying once with non-streaming mode...");

    try {
      let retryRunner;

      if (isGeneralPath) {
        const retryLlm = createStreamingLLM(false, {
          model:
            process.env.GENERAL_QUERY_MODEL?.trim() ||
            process.env.INTENT_CLASSIFIER_MODEL?.trim() ||
            "gemini-2.0-flash",
          temperature: 0.2,
          maxRetries: 0,
        });
        retryRunner = retryLlm;
      } else {
        const retryLlm = enableSearch
          ? createLLMWithSearch(false, getSearchGroundingConfig({ threshold: 0.7 }))
          : createStreamingLLM(false);
        retryRunner = retryLlm.bindTools(tools);
      }

      const retryResponse = await retryRunner.invoke(messages);
      console.log("[Graph:llm] Non-streaming retry succeeded");
      logResponseSummary(retryResponse);
      return { messages: [retryResponse] };
    } catch (retryError) {
      console.error(
        `[Graph:llm] Non-streaming retry failed: ${retryError.message}`
      );

      const safeFallback = new AIMessage({
        content:
          "I hit a temporary model streaming issue. Please resend your message and I will answer right away.",
      });

      return { messages: [safeFallback] };
    }
  }
}
