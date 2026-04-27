// src/ai/graph/fitness/index.js

import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import {
  intentNode,
  greetingNode,
  buildSimplePromptNode,
  retrieveContextNode,
  buildPromptNode,
  llmNode,
  toolsNode,
} from "./nodes/index.js";
import { routeAfterClassify, shouldContinueToTools } from "./edges.js";

export function buildFitnessGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode("classify", intentNode)
    .addNode("greeting", greetingNode)
    .addNode("buildSimplePrompt", buildSimplePromptNode)
    .addNode("retrieveContext", retrieveContextNode)
    .addNode("buildPrompt", buildPromptNode)
    .addNode("llm", llmNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "classify")
    .addConditionalEdges("classify", routeAfterClassify, {
      greeting: "greeting",
      nonGreeting: "retrieveContext",
    })
    .addEdge("greeting", END)
    .addEdge("buildSimplePrompt", "llm")
    .addEdge("retrieveContext", "buildPrompt")
    .addEdge("buildPrompt", "llm")
    .addConditionalEdges("llm", shouldContinueToTools)
    .addEdge("tools", "llm");

  return workflow.compile();
}

let compiledGraph = null;

export function getCompiledGraph() {
  if (!compiledGraph) {
    console.log("[Graph] Compiling StateGraph for the first time...");
    compiledGraph = buildFitnessGraph();
    console.log("[Graph] StateGraph compiled and cached");
  }
  return compiledGraph;
}
