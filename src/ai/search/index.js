// Context Retrieval - Used by Semantic Memory
export { buildMinimalContext } from './contextRetrieval';

// Semantic Memory Retrieval - Used by Professional Flow
export { 
  buildEnhancedContext, 
  buildLightweightContext, 
  buildSmartContext,
  formatContextForPrompt,
  getContextStats 
} from './semanticMemoryRetrieval';