// src/ai/index.js
// Stable public entrypoint for active AI runtime modules.

export {
  processAiChat,
  processChatWithGraph,
} from "./graph/stream.js";

export {
  buildFitnessGraph,
  getCompiledGraph,
} from "./graph/index.js";

export {
  createChatMemory,
  getRecentChatHistory,
  addToHistory,
  formatChatHistoryForContext,
} from "./memory/chatMemory.js";

export {
  analyzeIntent,
} from "./reasoning/intentClassifierV2.js";

export {
  detectIntent,
  QueryType,
  getGreetingResponse,
} from "./reasoning/intentRouter.js";

export {
  buildSmartContext,
  getContextStats,
} from "./search/semanticMemoryRetrieval.js";

export {
  createStreamingLLM,
  createLLMWithSearch,
  LLM_CONFIG,
} from "./config/llmconfig.js";

export {
  shouldEnableSearch,
  getSearchGroundingConfig,
} from "./config/searchGrounding.js";

export * from "./tools/index.js";
