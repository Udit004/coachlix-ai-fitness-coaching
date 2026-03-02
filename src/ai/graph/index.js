// src/ai/graph/index.js
// LangGraph StateGraph — Coachlix AI Pipeline
//
// This file compiles the fitness coaching pipeline into a reusable StateGraph.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  START                                                                  │
// │    │                                                                    │
// │    ▼                                                                    │
// │  classify  ─────────────────────────────────────────────────────────── │
// │    │ (always)                                                           │
// │    ▼                                                                    │
// │  retrieveContext  (inline logic skips DB for greeting/motivation/etc.) │
// │    │ (always)                                                           │
// │    ▼                                                                    │
// │  buildPrompt                                                            │
// │    │ (always)                                                           │
// │    ▼                                                                    │
// │  llm ──── tool_calls present? ──yes──▶  tools ──┐                     │
// │    │                                             │                     │
// │    │ no                                          └──▶ llm (loop)       │
// │    ▼                                                                   │
// │   END                                                                  │
// └─────────────────────────────────────────────────────────────────────────┘
//
// The graph is compiled once and cached globally (one compile per process).
// Vercel serverless: no checkpointer — state is ephemeral per request.
// Cross-session memory is managed by MongoDBChatMessageHistory inside
// retrieveContextNode, exactly as before.

import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import {
  intentNode,
  retrieveContextNode,
  buildPromptNode,
  llmNode,
  toolsNode,
  shouldContinueToTools,
} from "./nodes.js";

/**
 * Build and compile the Coachlix fitness coaching StateGraph.
 *
 * @returns {CompiledStateGraph}
 */
export function buildFitnessGraph() {
  const workflow = new StateGraph(GraphState)
    // ── Nodes ───────────────────────────────────────────────────────────────
    .addNode("classify", intentNode)
    .addNode("retrieveContext", retrieveContextNode)
    .addNode("buildPrompt", buildPromptNode)
    .addNode("llm", llmNode)
    .addNode("tools", toolsNode)

    // ── Edges ────────────────────────────────────────────────────────────────
    // Entry point
    .addEdge(START, "classify")

    // Intent → context (the node handles the skip internally)
    .addEdge("classify", "retrieveContext")

    // Context → prompt builder
    .addEdge("retrieveContext", "buildPrompt")

    // Prompt → first LLM call
    .addEdge("buildPrompt", "llm")

    // LLM → conditional:
    //   if AIMessage has tool_calls → toolsNode
    //   else → END (final response)
    .addConditionalEdges("llm", shouldContinueToTools)

    // After tools finish → back to LLM (handles multi-step tool use)
    .addEdge("tools", "llm");

  return workflow.compile();
}

// ── Singleton ─────────────────────────────────────────────────────────────────
// The compiled graph is expensive to build but cheap to reuse.
// We cache it in module scope so all requests share the same compiled instance.

/** @type {import("@langchain/langgraph").CompiledStateGraph | null} */
let _compiledGraph = null;

/**
 * Returns the compiled graph, building it on first call.
 * Thread-safe for Node.js single-threaded event loop.
 *
 * @returns {import("@langchain/langgraph").CompiledStateGraph}
 */
export function getCompiledGraph() {
  if (!_compiledGraph) {
    console.log("[Graph] Compiling StateGraph for the first time…");
    _compiledGraph = buildFitnessGraph();
    console.log("[Graph] ✅ StateGraph compiled and cached");
  }
  return _compiledGraph;
}
