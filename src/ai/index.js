// src/ai/index.js
// Central export point for all AI functionality

// FUNCTION CALLING ORCHESTRATOR (TRUE STREAMING with pause/resume) ✅
// Uses Gemini's native .stream() API for real-time token streaming
export {
  processChatMessageWithFunctionCallingStreaming
} from './orchestrator-function-calling';

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