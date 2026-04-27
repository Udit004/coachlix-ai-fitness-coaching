// src/ai/graph/fitness/edges.js

import { END } from "@langchain/langgraph";
import { QueryType } from "../../reasoning/intentRouter.js";

export function routeAfterClassify(state) {
  const { queryType, intent } = state;

  if (queryType === QueryType.GREETING) {
    console.log(
      `[Graph:route] classify -> greeting (instant response - intent: ${intent?.intent})`
    );
    return "greeting";
  }

  if (queryType === QueryType.GENERAL_FITNESS) {
    console.log(
      `[Graph:route] classify -> buildSimplePrompt (general query via small model - intent: ${intent?.intent})`
    );
    return "general";
  }

  console.log(
    `[Graph:route] classify -> retrieveContext (personalized query with RAG/tools - intent: ${intent?.intent})`
  );
  return "personalized";
}

export function shouldContinueToTools(state) {
  const last = state.messages.at(-1);
  const hasCalls = Array.isArray(last?.tool_calls) && last.tool_calls.length > 0;

  if (hasCalls) {
    console.log(`[Graph:edge] llm -> tools (${last.tool_calls.length} call(s))`);
    return "tools";
  }

  console.log("[Graph:edge] llm -> END (final response)");
  return END;
}
