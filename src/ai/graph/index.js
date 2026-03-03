// src/ai/graph/index.js
// LangGraph StateGraph — Coachlix AI Pipeline
//
// This file compiles the fitness coaching pipeline into a reusable StateGraph.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  START                                                                   │
// │    │                                                                     │
// │    ▼                                                                     │
// │  classify ──────── routeAfterClassify() ──────────────────────────────  │
// │         │                   │                          │                 │
// │  GREETING           GENERAL_FITNESS           PERSONALIZED_FITNESS       │
// │         │                   │                          │                 │
// │         ▼                   ▼                          ▼                 │
// │      greeting        buildSimplePrompt          retrieveContext          │
// │    (template)        (no profile data)                 │                 │
// │         │                   │                          ▼                 │
// │         ▼                   │                    buildPrompt             │
// │        END                  │               (selective profile)          │
// │                             └─────────────────────────┘                 │
// │                                           ▼                              │
// │                              llm ── tool_calls? ──yes──▶ tools ──┐      │
// │                               │                                   │      │
// │                               │ no                     └──▶ llm (loop)  │
// │                               ▼                                          │
// │                              END                                         │
// └──────────────────────────────────────────────────────────────────────────┘
//
// The graph is compiled once and cached globally (one compile per process).
// Vercel serverless: no checkpointer — state is ephemeral per request.
// Cross-session memory is managed by MongoDBChatMessageHistory inside
// retrieveContextNode, exactly as before.

import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import {
  intentNode,
  routeAfterClassify,
  greetingNode,
  buildSimplePromptNode,
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
    .addNode("greeting", greetingNode)              // GREETING: template, no LLM
    .addNode("buildSimplePrompt", buildSimplePromptNode) // GENERAL_FITNESS: no profile
    .addNode("retrieveContext", retrieveContextNode)
    .addNode("buildPrompt", buildPromptNode)
    .addNode("llm", llmNode)
    .addNode("tools", toolsNode)

    // ── Edges ────────────────────────────────────────────────────────────────
    // Entry point
    .addEdge(START, "classify")

    // Three-way branch after intent classification:
    //   GREETING          → greeting (returns template, bypasses LLM)
    //   GENERAL_FITNESS   → buildSimplePrompt → llm  (no profile in prompt)
    //   PERSONALIZED_FITNESS → retrieveContext → buildPrompt → llm
    .addConditionalEdges("classify", routeAfterClassify, {
      greeting: "greeting",
      buildSimplePrompt: "buildSimplePrompt",
      retrieveContext: "retrieveContext",
    })

    // Greeting fast-path → END immediately (no LLM call)
    .addEdge("greeting", END)

    // General fitness path: minimal prompt → LLM (no profile data)
    .addEdge("buildSimplePrompt", "llm")

    // Personalized path: context retrieval → profile-aware prompt → LLM
    .addEdge("retrieveContext", "buildPrompt")
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
