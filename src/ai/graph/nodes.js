// src/ai/graph/nodes.js
// LangGraph Node Functions
//
// Each node receives the current GraphState and returns a *partial* state
// update. LangGraph merges this partial update using the field reducers
// defined in state.js.
//
// Nodes in this graph:
//  1. intentNode         — classify intent with V2 classifier (~0 ms, no LLM)
//  2. retrieveContextNode — RAG/vector context from MongoDB + Pinecone
//  3. buildPromptNode    — select prompt tier & assemble initial messages
//  4. llmNode            — call Gemini (streaming); may return tool_calls
//  5. toolsNode          — execute all tool_calls in PARALLEL, return ToolMessages

import { ToolMessage } from "@langchain/core/messages";

import { analyzeIntent } from "../reasoning/intentClassifierV2.js";
import { buildSmartContext } from "../search/semanticMemoryRetrieval.js";
import { generateSmartPrompt } from "../prompts/ultraOptimizedPromptBuilder.js";
import { generateOptimizedSystemPrompt } from "../prompts/dynamicPromptBuilder.js";
import { createStreamingLLM, createLLMWithSearch } from "../config/llmconfig.js";
import {
  shouldEnableSearch,
  logSearchUsage,
  getSearchGroundingConfig,
} from "../config/searchGrounding.js";
import { buildChatHistory, buildInitialMessages } from "../streaming/messageBuilder.js";
import {
  buildMultimodalContent,
  isMultimodalContent,
} from "../multimodal/contentBuilder.js";
import { getToolByName } from "../tools/index.js";
import { createGraphTools } from "./graphTools.js";
import { END } from "@langchain/langgraph";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Intents that need no database / vector context (saves ~400 ms) */
const SKIP_RAG_INTENTS = ["greeting", "motivation", "complaint", "feedback"];

/** Intents that need no chat history in the prompt (saves ~300 tokens) */
const SKIP_HISTORY_INTENTS = [
  "greeting",
  "motivation",
  "complaint",
  "question_general",
];

// ─── Node 1: Intent Classification ───────────────────────────────────────────

/**
 * Synchronous intent classification using rule-based V2 classifier.
 * Takes ~0 ms (no LLM call) and also decides whether Google Search is needed.
 */
export async function intentNode(state) {
  const { originalMessage, profile, conversationHistory } = state;
  const t0 = Date.now();

  const intent = analyzeIntent(originalMessage, {
    profile,
    conversationHistory,
    hasDietPlan: !!profile?.activeDietPlan,
    hasWorkoutPlan: !!profile?.activeWorkoutPlan,
  });

  const enableSearch = shouldEnableSearch(intent, originalMessage);
  logSearchUsage(state.userId, intent, enableSearch);

  console.log(
    `[Graph:intent] ${intent.intent} ` +
      `(${(intent.confidence * 100).toFixed(0)}%) ` +
      `priority=${intent.dataNeeds?.priority} ` +
      `search=${enableSearch}`
  );

  return {
    intent,
    enableSearch,
    flowMetrics: { intentClassificationTime: Date.now() - t0 },
  };
}

// ─── Node 2: RAG Context Retrieval ───────────────────────────────────────────

/**
 * Retrieves user context from MongoDB + Pinecone vector store.
 * Automatically skips the DB query for intents that don't need personal data
 * (e.g. greetings, motivational replies) to save ~400 ms.
 */
export async function retrieveContextNode(state) {
  const { userId, originalMessage, intent } = state;
  const t0 = Date.now();

  const skipForGeneral =
    intent.intent === "question_general" && !intent.requiresData;
  const shouldSkip =
    SKIP_RAG_INTENTS.includes(intent.intent) || skipForGeneral;

  if (shouldSkip) {
    console.log("[Graph:context] RAG SKIPPED (simple intent — no DB query needed)");
    return {
      userContext: {
        profile: { name: "User" },
        dietPlan: null,
        workoutPlan: null,
        conversationHistory: [],
      },
      flowMetrics: { contextRetrievalTime: 0 },
    };
  }

  console.log("[Graph:context] Retrieving smart context (RAG + MongoDB)…");
  const userContext = await buildSmartContext(userId, originalMessage, intent);
  const elapsed = Date.now() - t0;
  console.log(`[Graph:context] Context ready in ${elapsed} ms`);

  return {
    userContext,
    flowMetrics: { contextRetrievalTime: elapsed },
  };
}

// ─── Node 3: Prompt Builder ───────────────────────────────────────────────────

/**
 * Selects the optimal prompt tier and assembles the initial LangChain messages
 * array (SystemMessage + filtered history + HumanMessage / multimodal content).
 *
 * Prompt tiers (in descending token-efficiency):
 *   ULTRA-OPTIMISED  →  V2 intent + confidence ≥ 0.60  (70-90% token reduction)
 *   DYNAMIC          →  V2 intent + confidence < 0.60   (40-60% token reduction)
 */
export async function buildPromptNode(state) {
  const {
    originalMessage,
    files,
    intent,
    userContext,
    conversationHistory,
    userId,
  } = state;

  // ── Select prompt tier ────────────────────────────────────────────────────
  let systemPrompt;
  if (intent.version === "v2" && intent.confidence >= 0.6) {
    systemPrompt = generateSmartPrompt(intent, userContext, userId);
    console.log("[Graph:prompt] ULTRA-OPTIMISED prompt selected");
  } else {
    systemPrompt = generateOptimizedSystemPrompt(intent, userContext, userId, null);
    console.log("[Graph:prompt] DYNAMIC prompt selected");
  }

  // ── Chat history filtering ────────────────────────────────────────────────
  const chatHistory = buildChatHistory(conversationHistory);
  const filteredHistory = SKIP_HISTORY_INTENTS.includes(intent.intent)
    ? []
    : chatHistory;

  if (chatHistory.length > 0 && filteredHistory.length === 0) {
    console.log(
      `[Graph:prompt] Chat history SKIPPED for intent "${intent.intent}" ` +
        `(saved ~${chatHistory.length * 50} tokens)`
    );
  }

  // ── Multimodal content handling ───────────────────────────────────────────
  let userContent;
  if (isMultimodalContent(files)) {
    console.log("[Graph:prompt] Building multimodal content (text + files)…");
    userContent = await buildMultimodalContent(originalMessage, files);
  } else {
    userContent = originalMessage;
  }

  const messages = buildInitialMessages(systemPrompt, filteredHistory, userContent);
  console.log(`[Graph:prompt] ${messages.length} messages assembled`);

  return { messages };
}

// ─── Node 4: LLM Inference ───────────────────────────────────────────────────

/**
 * Binds structured tools to Gemini and calls the model.
 * Returns an AIMessage that either:
 *   (a) contains `tool_calls` → graph routes to toolsNode, or
 *   (b) is a plain text reply → graph routes to END.
 *
 * By calling llm.invoke() here (not llm.stream()), we let the outer
 * graph.streamEvents() capture the individual tokens and stream them
 * to the frontend without any extra wiring in this node.
 */
export async function llmNode(state) {
  const { messages, enableSearch } = state;

  // ── Build tools list (optionally exclude nutrition_lookup with search) ────
  const excludedTools = enableSearch ? ["nutrition_lookup"] : [];
  const tools = createGraphTools(excludedTools);

  // ── Create LLM instance ───────────────────────────────────────────────────
  let llm;
  if (enableSearch) {
    const searchConfig = getSearchGroundingConfig({ threshold: 0.7 });
    llm = createLLMWithSearch(true, searchConfig);
    console.log("[Graph:llm] Using Gemini + Google Search grounding");
  } else {
    llm = createStreamingLLM(true);
    console.log("[Graph:llm] Using standard Gemini 2.5 Flash");
  }

  // bindTools() converts DynamicStructuredTool schemas → Gemini function declarations
  // and ensures the AIMessage response has the standard LangChain `tool_calls` attribute
  const llmWithTools = llm.bindTools(tools);

  console.log(
    `[Graph:llm] Invoking — ${tools.length} tools bound, ${messages.length} messages`
  );

  const response = await llmWithTools.invoke(messages);

  const toolCallCount = response.tool_calls?.length ?? 0;
  if (toolCallCount > 0) {
    const names = response.tool_calls.map((tc) => tc.name).join(", ");
    console.log(`[Graph:llm] ↳ Requesting tools: ${names}`);
  } else {
    const chars =
      typeof response.content === "string"
        ? response.content.length
        : JSON.stringify(response.content ?? "").length;
    console.log(`[Graph:llm] ↳ Final response generated (${chars} chars)`);
  }

  return { messages: [response] };
}

// ─── Node 5: Parallel Tool Execution ─────────────────────────────────────────

/**
 * Executes ALL tool_calls from the last AIMessage *simultaneously* using
 * Promise.all. This replaces the old sequential while-loop in the orchestrator
 * and is the single biggest latency improvement for multi-tool requests.
 *
 * If the LLM omitted userId in a tool call, this node injects it from state
 * to prevent 401/404 errors.
 */
export async function toolsNode(state) {
  const { messages, userId } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCalls = lastMessage?.tool_calls ?? [];

  if (toolCalls.length === 0) {
    console.log("[Graph:tools] No tool calls — skipping");
    return {};
  }

  console.log(
    `[Graph:tools] Executing ${toolCalls.length} tool(s) in PARALLEL: ` +
      toolCalls.map((tc) => tc.name).join(", ")
  );
  const t0 = Date.now();

  const toolMessages = await Promise.all(
    toolCalls.map(async (toolCall) => {
      // Ensure userId is always available inside the tool
      const args = { ...toolCall.args };
      if (!args.userId) args.userId = userId;

      const toolFn = getToolByName(toolCall.name);
      let content;

      if (!toolFn) {
        console.error(`[Graph:tools] ❌ Unknown tool: "${toolCall.name}"`);
        content = `Error: Tool "${toolCall.name}" is not available.`;
      } else {
        try {
          const result = await toolFn(args);
          content = typeof result === "string" ? result : JSON.stringify(result);
          console.log(`[Graph:tools] ✅ ${toolCall.name} done`);
        } catch (err) {
          console.error(`[Graph:tools] ❌ ${toolCall.name} failed:`, err.message);
          content = `Error executing ${toolCall.name}: ${err.message}`;
        }
      }

      return new ToolMessage({
        content,
        tool_call_id: toolCall.id,
        name: toolCall.name,
      });
    })
  );

  console.log(
    `[Graph:tools] All ${toolCalls.length} tool(s) resolved in ${Date.now() - t0} ms`
  );

  return {
    messages: toolMessages,
    toolsUsed: toolCalls.map((tc) => tc.name),
  };
}

// ─── Conditional Edge ─────────────────────────────────────────────────────────

/**
 * Routing function used by addConditionalEdges("llm", …).
 *
 * Returns "tools" when the AIMessage contains tool_calls (→ toolsNode),
 * or END when the LLM produced a final text response (→ graph terminates).
 */
export function shouldContinueToTools(state) {
  const last = state.messages.at(-1);
  const hasCalls = Array.isArray(last?.tool_calls) && last.tool_calls.length > 0;

  if (hasCalls) {
    console.log(`[Graph:edge] llm → tools (${last.tool_calls.length} call(s))`);
    return "tools";
  }

  console.log("[Graph:edge] llm → END (final response)");
  return END;
}
