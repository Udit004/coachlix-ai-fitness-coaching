// src/ai/graph/stream.js
// LangGraph streaming entry point
//
// processChatWithGraph() is a drop-in replacement for processChatWithProfessionalFlow().
// It has the same function signature and return shape so no API route changes are needed.
//
// Key improvements over the old orchestrator:
//  • No pre-stream ReAct loop   → first token arrives 2-12 s faster for complex queries
//  • Parallel tool execution    → multiple tools run concurrently via Promise.all
//  • Single tool-call path      → no dual Gemini-native / manual ReAct split
//  • No post-stream validation  → one fewer LLM call per request (~500 ms saved)
//  • Per-node error isolation   → node failures don't crash the whole pipeline

import { getCompiledGraph } from "./index.js";
import {
  extractChunkText,
  streamTextToFrontend,
  sendCompletionSignal,
} from "../streaming/streamProcessor.js";
import {
  getContentTypeDescription,
  getFilesSummary,
} from "../multimodal/contentBuilder.js";
import { getContextStats } from "../search/semanticMemoryRetrieval.js";

/**
 * Process a chat message through the LangGraph pipeline with real-time streaming.
 *
 * Tokens are forwarded to `onChunk` word-by-word as they arrive from Gemini,
 * preserving the exact same streaming UX as the previous orchestrator.
 *
 * @param {Object}   params
 * @param {string}   params.message             - User's text message
 * @param {Array}    [params.files]              - Attached files / images (multimodal)
 * @param {string}   params.userId              - Authenticated user ID
 * @param {string}   [params.plan="general"]    - Plan context (currently unused; kept for compat)
 * @param {Object}   [params.profile=null]      - User profile object from DB
 * @param {Array}    [params.conversationHistory=[]] - Recent chat history
 *
 * @param {Function} onChunk - Streaming callback: ({ word, partialResponse, isComplete }) => void
 *
 * @returns {Promise<{response: string, metadata: Object}>}
 */
export async function processChatWithGraph(params, onChunk) {
  const {
    message,
    files = null,
    userId,
    plan = "general",
    profile = null,
    conversationHistory = [],
  } = params;

  const startTime = Date.now();
  const contentType = getContentTypeDescription(message, files);
  const filesSummary = getFilesSummary(files);

  console.log("\n" + "=".repeat(80));
  console.log("[Graph] 🚀 LANGGRAPH PIPELINE STARTING");
  console.log("[Graph] User:", userId);
  console.log("[Graph] Message:", message);
  console.log("[Graph] History:", conversationHistory.length, "messages");
  console.log("[Graph] Content type:", contentType);
  if (filesSummary.count > 0) {
    console.log("[Graph] Files:", filesSummary.count, "| Types:", filesSummary.types?.join(", "));
  }
  console.log("=".repeat(80) + "\n");

  // ── Initial state passed to the graph ─────────────────────────────────────
  const initialState = {
    messages: [],
    userId,
    originalMessage: message,
    files,
    conversationHistory,
    profile,
    startTime,
    toolsUsed: [],
    flowMetrics: {},
  };

  // ── Tracking variables accumulated from streaming events ──────────────────
  let fullResponse = "";
  let lastWord = "";
  let toolsUsed = [];
  let intentMeta = null;
  let contextStatsMeta = null;
  let enableSearchMeta = false;

  const graph = getCompiledGraph();

  try {
    // ── Stream graph events ─────────────────────────────────────────────────
    // graph.streamEvents emits:
    //   • on_chat_model_stream  — individual LLM tokens (text or tool-call chunks)
    //   • on_chain_start/end    — node lifecycle events (used to collect metadata)
    //   • on_tool_start/end     — tool execution events
    const eventStream = graph.streamEvents(initialState, { version: "v2" });

    for await (const event of eventStream) {
      const { event: eventType, data, metadata } = event;

      // ── Forward text tokens to the frontend word-by-word ─────────────────
      // Only capture tokens from the "llm" node — avoids emitting debug output
      // from any other potential LangChain chains triggered inside nodes.
      if (
        eventType === "on_chat_model_stream" &&
        metadata?.langgraph_node === "llm"
      ) {
        const chunk = data?.chunk;
        const text = extractChunkText(chunk);
        if (text) {
          fullResponse += text;
          lastWord = await streamTextToFrontend(text, fullResponse, onChunk);
        }
        continue;
      }

      // ── Collect metadata from node outputs ────────────────────────────────
      if (eventType === "on_chain_end") {
        const output = data?.output;
        if (!output) continue;

        if (output.intent) {
          intentMeta = output.intent;
        }
        if (output.userContext) {
          contextStatsMeta = getContextStats(output.userContext);
        }
        if (typeof output.enableSearch === "boolean") {
          enableSearchMeta = output.enableSearch;
        }
        if (Array.isArray(output.toolsUsed) && output.toolsUsed.length > 0) {
          toolsUsed = [...toolsUsed, ...output.toolsUsed];
        }
      }
    }

    // ── Send completion signal ────────────────────────────────────────────────
    // lastWord from streamTextToFrontend is a truthy guard — use "done" as
    // the fallback so sendCompletionSignal always fires even for empty responses.
    await sendCompletionSignal(onChunk, fullResponse, lastWord || "done");

    const totalTime = Date.now() - startTime;

    console.log("\n" + "=".repeat(80));
    console.log("[Graph] ✅ PIPELINE COMPLETE");
    console.log("[Graph] Total time:", totalTime, "ms");
    console.log("[Graph] Response length:", fullResponse.length, "chars");
    console.log("[Graph] Tools used:", toolsUsed.join(", ") || "none");
    console.log("[Graph] Google Search:", enableSearchMeta ? "yes" : "no");
    console.log("=".repeat(80) + "\n");

    // ── Return in the same shape as processChatWithProfessionalFlow ──────────
    return {
      response: fullResponse,
      metadata: {
        // Architecture identifier (useful for A/B comparisons in logs)
        architecture: "langgraph",
        graphVersion: "0.2",

        // Multimodal
        contentType,
        hasFiles: filesSummary.count > 0,
        filesProcessed: filesSummary.count,
        filesSummary: filesSummary.count > 0 ? filesSummary : null,

        // Intent (V2 classifier)
        intent: intentMeta?.intent ?? null,
        intentConfidence: intentMeta?.confidence ?? null,
        requiresData: intentMeta?.requiresData ?? false,
        priority: intentMeta?.dataNeeds?.priority ?? null,
        intentClassifierVersion: intentMeta?.version ?? "v2",
        hasMultipleIntents: intentMeta?.hasMultipleIntents ?? false,
        disambiguationApplied: intentMeta?.disambiguationApplied ?? false,
        entitiesExtracted: intentMeta?.entityStats?.totalEntities ?? 0,
        entities: intentMeta?.entities ?? null,

        // Context
        contextStats: contextStatsMeta,

        // Search
        googleSearchEnabled: enableSearchMeta,
        searchReason: enableSearchMeta
          ? `Intent: ${intentMeta?.intent}`
          : "Not needed",

        // Reasoning (ReAct loop removed — Gemini handles tool use natively)
        reasoningEnabled: false,
        reasoningPath: "none",
        reactEnabled: false,
        reactSteps: 0,
        reactToolCalls: 0,
        keyPoints: [],

        // Tools (parallel execution)
        llmCalls: toolsUsed.length > 0 ? toolsUsed.length + 1 : 1,
        toolsUsed,
        toolCallCount: toolsUsed.length,

        // Validation (post-stream validation removed — saves ~500 ms per request)
        validationEnabled: false,
        validationScore: null,
        validationVerdict: null,
        autoFixApplied: false,

        // Performance
        timings: { totalTime },
        responseLength: fullResponse.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[Graph] ❌ Pipeline error:", error);

    // Always send a completion signal so the frontend doesn't hang
    try {
      await sendCompletionSignal(onChunk, fullResponse, lastWord || "error");
    } catch (_) {
      // ignore — onChunk might itself have errored
    }

    return {
      response:
        "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      metadata: {
        architecture: "langgraph",
        error: error.message,
        llmCalls: 0,
        timeTaken: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
