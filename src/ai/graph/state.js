// src/ai/graph/state.js
// LangGraph State Definition for Coachlix AI
//
// Replaces the imperative waterfall orchestrator with a typed state machine.
// Each field has a named reducer that controls how concurrent/sequential updates merge.

import { Annotation } from "@langchain/langgraph";

// ─── Reducers ─────────────────────────────────────────────────────────────────

/**
 * Appends new messages to the existing message list.
 * Used for the messages channel so tool results and LLM responses
 * accumulate correctly across the llm → tools → llm loop.
 */
function addMessages(existing, incoming) {
  const left = Array.isArray(existing) ? existing : (existing ? [existing] : []);
  const right = Array.isArray(incoming) ? incoming : (incoming ? [incoming] : []);
  return [...left, ...right];
}

/**
 * Shallow-merges two objects. Used for flowMetrics so each node
 * can add its timing data without clobbering other nodes' data.
 */
function mergeObjects(existing, incoming) {
  return { ...(existing ?? {}), ...(incoming ?? {}) };
}

/**
 * Concatenates two arrays. Used for toolsUsed so every round
 * of tool calls is recorded, not just the last one.
 */
function appendArray(existing, incoming) {
  return [
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(incoming) ? incoming : []),
  ];
}

/** Last-write-wins — used for all scalar / object fields. */
const lastWrite = (_, x) => x;

// ─── State Definition ─────────────────────────────────────────────────────────

/**
 * GraphState – the entire per-request state object that flows through the graph.
 *
 * Fields are grouped by lifecycle:
 *  • Runtime inputs:  set once when the graph is invoked; never mutated afterwards.
 *  • Pipeline state:  written/updated by individual nodes as the graph progresses.
 *  • Telemetry:       accumulated across the full run for metrics / debugging.
 */
export const GraphState = Annotation.Root({
  // ── LangGraph messages channel ────────────────────────────────────────────
  // Accumulates HumanMessage, AIMessage, ToolMessage objects throughout the run.
  // addMessages appends rather than replaces, so tool results are never lost.
  messages: Annotation({
    reducer: addMessages,
    default: () => [],
  }),

  // ── Runtime inputs (set once at graph start, never overwritten) ───────────
  userId: Annotation({
    reducer: lastWrite,
    default: () => "",
  }),
  originalMessage: Annotation({
    reducer: lastWrite,
    default: () => "",
  }),
  files: Annotation({
    reducer: lastWrite,
    default: () => null,
  }),
  conversationHistory: Annotation({
    reducer: lastWrite,
    default: () => [],
  }),
  profile: Annotation({
    reducer: lastWrite,
    default: () => null,
  }),

  // ── Pipeline state (written by individual nodes as the graph progresses) ──
  /** Result from IntentClassifierV2 */
  intent: Annotation({
    reducer: lastWrite,
    default: () => null,
  }),
  /** Smart context object from buildSmartContext() / RAG retrieval */
  userContext: Annotation({
    reducer: lastWrite,
    default: () => null,
  }),
  /** Whether Google Search grounding should be enabled for this request */
  enableSearch: Annotation({
    reducer: lastWrite,
    default: () => false,
  }),

  // ── Telemetry ─────────────────────────────────────────────────────────────
  /** All tool names called across every tool-loop iteration */
  toolsUsed: Annotation({
    reducer: appendArray,
    default: () => [],
  }),
  /** Unix timestamp (ms) when the request started */
  startTime: Annotation({
    reducer: lastWrite,
    default: () => 0,
  }),
  /** Per-node timing data merged together at the end */
  flowMetrics: Annotation({
    reducer: mergeObjects,
    default: () => ({}),
  }),
});
