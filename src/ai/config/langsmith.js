// src/ai/config/langsmith.js
// LangSmith tracing configuration for debugging and monitoring

import { Client as LangSmithClient } from "langsmith";

// ---------- LangSmith Setup ----------
let langsmithClient = null;

/**
 * Initialize LangSmith client for tracing
 * This is called automatically when the module is imported
 */
function initializeLangSmith() {
  if (process.env.LANGCHAIN_TRACING_V2 === "true" && process.env.LANGCHAIN_API_KEY) {
    try {
      langsmithClient = new LangSmithClient({
        apiKey: process.env.LANGCHAIN_API_KEY,
      });
      console.log("✅ LangSmith tracing enabled");
    } catch (err) {
      console.warn("⚠️ LangSmith initialization failed:", err.message);
    }
  }
}

// Initialize on module load
initializeLangSmith();

/**
 * Get the LangSmith client instance
 * @returns {LangSmithClient|null} The LangSmith client or null if not initialized
 */
export function getLangSmithClient() {
  return langsmithClient;
}

/**
 * Check if LangSmith tracing is enabled
 * @returns {boolean} True if LangSmith is enabled and initialized
 */
export function isLangSmithEnabled() {
  return langsmithClient !== null;
}

/**
 * Re-initialize LangSmith client (useful for testing or config changes)
 */
export function reinitializeLangSmith() {
  langsmithClient = null;
  initializeLangSmith();
}

export default langsmithClient;
