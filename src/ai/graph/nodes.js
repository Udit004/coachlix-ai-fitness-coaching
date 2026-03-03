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
import { detectIntent, QueryType, getGreetingResponse } from "../reasoning/intentRouter.js";
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

/**
 * Only the profile fields that a PERSONALIZED_FITNESS prompt actually needs.
 * Avoids dumping the full raw profile JSON into the system prompt.
 */
const PROFILE_FIELDS_FOR_PROMPT = ["activityLevel", "experience", "fitnessGoal"];

// ─── Node 1: Intent Classification ───────────────────────────────────────────

/**
 * Synchronous intent classification using rule-based V2 classifier.
 * Takes ~0 ms (no LLM call) and also decides whether Google Search is needed.
 */
export async function intentNode(state) {
  const { originalMessage, profile, conversationHistory } = state;
  const t0 = Date.now();

  // ── V2 rule-based intent classification (~0 ms, no LLM) ─────────────────
  const intent = analyzeIntent(originalMessage, {
    profile,
    conversationHistory,
    hasDietPlan: !!profile?.activeDietPlan,
    hasWorkoutPlan: !!profile?.activeWorkoutPlan,
  });

  // ── High-level routing tier (GREETING / GENERAL_FITNESS / PERSONALIZED) ──
  // detectIntent uses the V2 result as primary signal so classification is
  // done exactly once — this call is pure JS, O(1), no network.
  const { queryType } = detectIntent(originalMessage, intent);

  const enableSearch = shouldEnableSearch(intent, originalMessage);
  logSearchUsage(state.userId, intent, enableSearch);

  console.log(
    `[Graph:intent] ${intent.intent} ` +
      `(${(intent.confidence * 100).toFixed(0)}%) ` +
      `queryType=${queryType} ` +
      `priority=${intent.dataNeeds?.priority} ` +
      `search=${enableSearch}`
  );

  return {
    intent,
    queryType,
    enableSearch,
    flowMetrics: { intentClassificationTime: Date.now() - t0 },
  };
}

// ─── Routing: after classify ─────────────────────────────────────────────────

/**
 * Three-way router executed after intentNode.
 *
 * GREETING          → "greeting"        (template reply, zero LLM cost)
 * GENERAL_FITNESS   → "buildSimplePrompt" (LLM with no profile data)
 * PERSONALIZED_FITNESS → "retrieveContext"  (full RAG + profile-aware prompt)
 */
export function routeAfterClassify(state) {
  const { queryType, intent } = state;

  if (queryType === QueryType.GREETING) {
    console.log(
      `[Graph:route] classify → greeting (BYPASS LLM — intent: ${intent?.intent})`
    );
    return "greeting";
  }

  if (queryType === QueryType.GENERAL_FITNESS) {
    console.log(
      `[Graph:route] classify → buildSimplePrompt (no profile — intent: ${intent?.intent})`
    );
    return "buildSimplePrompt";
  }

  console.log(
    `[Graph:route] classify → retrieveContext (personalized — intent: ${intent?.intent})`
  );
  return "retrieveContext";
}

// ─── Node 1b: Greeting Node (zero-latency path) ──────────────────────────────

/**
 * Returns a pre-built template response directly to the caller — no LLM call,
 * no RAG, no prompt building. Target latency: <200 ms (pure in-process).
 *
 * The graph routes to END immediately after this node, so the template string
 * must be placed in `messages` as an AIMessage so the streaming layer can
 * surface it normally.
 */
export async function greetingNode(state) {
  const { originalMessage } = state;
  const t0 = Date.now();

  // Derive the template response from the original message.
  // This is a pure synchronous call — no network I/O, no LLM.
  const response = getGreetingResponse(originalMessage ?? "");

  // Wrap in an AIMessage so the streaming formatter sees the expected structure.
  const { AIMessage } = await import("@langchain/core/messages");
  const aiMessage = new AIMessage({ content: response });

  console.log(
    `[Graph:greeting] Template response returned in ${Date.now() - t0} ms` +
      " — LLM bypassed"
  );

  return {
    messages: [aiMessage],
    flowMetrics: { greetingResponseTime: Date.now() - t0 },
  };
}

// ─── Node 1c: General Fitness Prompt Builder (no profile) ─────────────────────

/**
 * Builds a minimal prompt for general fitness / small-talk queries.
 * Deliberately omits user profile data — only the raw question is sent.
 * Skips RAG, DB queries, and the full prompt-tier logic.
 * Target latency (LLM included): ~1.5 s.
 */
export async function buildSimplePromptNode(state) {
  const { originalMessage, files, intent } = state;

  // ── No profile data injected here (GENERAL_FITNESS path) ────────────────
  const systemPrompt =
    "You are Coachlix, a knowledgeable and encouraging AI fitness coach. " +
    "Answer clearly and concisely. Do not ask for personal data unless the " +
    "user explicitly provides it.";

  let userContent;
  if (isMultimodalContent(files)) {
    console.log("[Graph:simplePrompt] Building multimodal content…");
    userContent = await buildMultimodalContent(originalMessage, files);
  } else {
    userContent = originalMessage;
  }

  // Empty history — saves ~300 tokens for general questions
  const messages = buildInitialMessages(systemPrompt, [], userContent);
  console.log(
    `[Graph:simplePrompt] Profile-free prompt built for "${intent?.intent}" ` +
      `(${messages.length} msg — no RAG, no profile, no history)`
  );

  return { messages };
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
    profile,
  } = state;

  // ── Selective profile injection (PERSONALIZED_FITNESS path only) ─────────
  // Instead of forwarding the raw profile blob, extract only the three fields
  // that meaningfully affect a fitness coaching response. This keeps the
  // system prompt lean and avoids leaking irrelevant user data to the model.
  if (userContext && profile) {
    const relevantProfile = {};
    for (const field of PROFILE_FIELDS_FOR_PROMPT) {
      if (profile[field]) relevantProfile[field] = profile[field];
    }

    // Merge into userContext.profile so the prompt builders see it in the
    // same location they always read from — no API changes needed downstream.
    if (Object.keys(relevantProfile).length > 0) {
      userContext.profile = {
        ...userContext.profile,
        ...relevantProfile,
        // Concise human-readable summary avoids redundant raw-JSON in prompt
        _profileSummary:
          [
            relevantProfile.fitnessGoal
              ? `Goal: ${relevantProfile.fitnessGoal}`
              : null,
            relevantProfile.experience
              ? `Experience: ${relevantProfile.experience}`
              : null,
            relevantProfile.activityLevel
              ? `Activity: ${relevantProfile.activityLevel}`
              : null,
          ]
            .filter(Boolean)
            .join(" | ") || undefined,
      };
      console.log(
        `[Graph:prompt] Profile injected — fields: ${Object.keys(relevantProfile).join(", ")}`
      );
    }
  }

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
  const { messages, enableSearch, queryType } = state;

  // ── Tool filtering by execution path ─────────────────────────────────────
  // GENERAL_FITNESS: only factual/lookup tools are available (nutrition_lookup
  //   when search is off). Personal modification tools are excluded so the LLM
  //   cannot accidentally trigger plan reads/writes for simple factual queries.
  // PERSONALIZED_FITNESS: all 6 tools available.
  const PERSONAL_TOOLS = [
    "update_workout_plan",
    "calculate_health_metrics",
    "create_diet_plan",
    "update_diet_plan",
    "fetch_details",
  ];

  let excludedTools = enableSearch ? ["nutrition_lookup"] : [];
  if (queryType === QueryType.GENERAL_FITNESS) {
    excludedTools = [...new Set([...excludedTools, ...PERSONAL_TOOLS])];
    console.log("[Graph:llm] GENERAL path — personal tools excluded");
  }

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
