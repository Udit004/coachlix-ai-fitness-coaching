// src/ai/index.js
// Central export point for all AI functionality

// LANGGRAPH PIPELINE 🔥 (active — replaced professional flow)
// Intent → RAG Context → Prompt Builder → LLM ⇄ Tools (parallel) → Stream
export { processChatWithGraph } from './graph/stream';

// LEGACY PROFESSIONAL FLOW ORCHESTRATOR (kept for reference / fallback)
// Intent Classification → Semantic Memory (RAG) → Chain-of-Thought →
// Response Generation → Self-Critique → Refined Response
export {
  processChatWithProfessionalFlow
} from './orchestrator-professional-flow';

// Reasoning Modules
export * from './reasoning';

// Tools
export * from './tools';

// Prompts
export * from './prompts';

// Memory
export * from './memory';

// Search
export * from './search';

// Config
export * from './config';