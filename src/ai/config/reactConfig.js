// src/ai/config/reactConfig.js
// ReAct (Reasoning + Acting) Configuration
// Centralized configuration for ReAct loop behavior

/**
 * ReAct Loop Configuration
 * Control how the ReAct loop behaves
 */
export const REACT_LOOP_CONFIG = {
  // Execution limits
  maxSteps: 8,                    // Maximum reasoning-action cycles (prevent infinite loops)
  maxToolCalls: 5,                // Maximum tool calls per session
  timeoutMs: 15000,               // 15 seconds max for entire ReAct loop
  
  // Features
  enableReflection: true,         // Enable observation & reflection after tool calls
  verboseLogging: true,           // Detailed console logs for debugging
  
  // Performance
  parallelToolCalls: false,       // Execute multiple tools in parallel (experimental)
  cacheToolResults: true,         // Cache tool results to avoid duplicate calls
  
  // Safety
  validateToolParams: true,       // Validate tool parameters before execution
  maxRetriesPerTool: 1,          // Retry failed tool calls (0 = no retries)
};

/**
 * Intent-based ReAct Triggers
 * Which intents should automatically use ReAct
 */
export const REACT_INTENT_TRIGGERS = {
  // Always use ReAct for these intents
  alwaysUseReAct: [
    'workout_planning',           // Needs user data + workout generation
    'diet_planning',              // Needs user data + diet generation
    'progress_tracking',          // Needs historical data analysis
    'plan_modification'           // Needs current plan + updates
  ],
  
  // Use ReAct if confidence is below threshold
  useReActForLowConfidence: true,
  lowConfidenceThreshold: 0.70,   // Use ReAct if intent confidence < 70%
  
  // Use ReAct if entities detected
  useReActForEntityQueries: true, // "Show me chicken nutrition" triggers ReAct
  
  // Never use ReAct for these (too simple)
  neverUseReAct: [
    'greeting',
    'motivation',
    'complaint',
    'feedback'
  ]
};

/**
 * Tool Selection Strategy
 * How ReAct decides which tools to call
 */
export const TOOL_SELECTION_STRATEGY = {
  // Prioritize certain tools based on intent
  toolPriority: {
    'workout_planning': ['fetch_details', 'update_workout_plan', 'calculate_health_metrics'],
    'diet_planning': ['fetch_details', 'create_diet_plan', 'calculate_health_metrics'],
    'nutrition_inquiry': ['nutrition_lookup', 'fetch_details'],
    'progress_tracking': ['fetch_details', 'calculate_health_metrics']
  },
  
  // Smart deduplication
  preventDuplicateTools: true,     // Don't call same tool twice with same params
  preventSimilarTools: true,       // Don't call similar tools (e.g., fetch_details twice)
  
  // Tool call ordering
  preferDataFetchFirst: true,      // Fetch user data before generating plans
  batchCompatibleTools: false      // Group compatible tool calls (experimental)
};

/**
 * Reasoning Depth Configuration
 * How deep should the reasoning go
 */
export const REASONING_DEPTH = {
  // Reasoning complexity by priority
  high: {
    minSteps: 3,                   // At least 3 reasoning steps
    requireReflection: true,       // Must reflect on each tool result
    detailedThinking: true         // Verbose reasoning prompts
  },
  
  medium: {
    minSteps: 2,
    requireReflection: true,
    detailedThinking: false
  },
  
  low: {
    minSteps: 1,
    requireReflection: false,
    detailedThinking: false
  }
};

/**
 * Logging Configuration
 * What to log during ReAct execution
 */
export const REACT_LOGGING = {
  logThoughts: true,               // Log each reasoning step
  logActions: true,                // Log each tool call
  logObservations: true,           // Log each tool result
  logReflexions: true,             // Log each reflection
  logTimings: true,                // Log execution times
  
  // Log levels
  logLevel: 'info',                // 'debug' | 'info' | 'warn' | 'error'
  
  // Storage
  saveToDatabase: false,           // Save ReAct traces to database (for analysis)
  savePath: '/logs/react',         // Where to save logs
};

/**
 * Check if ReAct should be used for given intent and context
 * 
 * @param {Object} intent - Intent classification result
 * @param {Object} dataNeeds - Data requirements
 * @returns {boolean} - True if ReAct should be used
 */
export function shouldUseReAct(intent, dataNeeds) {
  // Check if in "never use" list
  if (REACT_INTENT_TRIGGERS.neverUseReAct.includes(intent.intent)) {
    return false;
  }
  
  // Check if in "always use" list
  if (REACT_INTENT_TRIGGERS.alwaysUseReAct.includes(intent.intent)) {
    return true;
  }
  
  // Check confidence threshold
  if (REACT_INTENT_TRIGGERS.useReActForLowConfidence && 
      intent.confidence < REACT_INTENT_TRIGGERS.lowConfidenceThreshold) {
    return true;
  }
  
  // Check if high priority
  if (dataNeeds.priority === 'high') {
    return true;
  }
  
  // Check if entities detected and entity queries enabled
  if (REACT_INTENT_TRIGGERS.useReActForEntityQueries && 
      intent.entities && 
      (intent.entities.foods?.length > 0 || intent.entities.exercises?.length > 0)) {
    return true;
  }
  
  // Check if requires data
  if (intent.requiresData) {
    return true;
  }
  
  // Default: don't use ReAct
  return false;
}

/**
 * Get recommended tools for given intent
 * 
 * @param {string} intentName - Intent name
 * @returns {string[]} - List of recommended tool names
 */
export function getRecommendedTools(intentName) {
  return TOOL_SELECTION_STRATEGY.toolPriority[intentName] || [];
}

/**
 * Get reasoning depth config for priority level
 * 
 * @param {string} priority - 'high' | 'medium' | 'low'
 * @returns {Object} - Reasoning depth configuration
 */
export function getReasoningDepth(priority) {
  return REASONING_DEPTH[priority] || REASONING_DEPTH.medium;
}

/**
 * Format ReAct configuration summary for logging
 * 
 * @returns {string} - Formatted configuration
 */
export function getReActConfigSummary() {
  return `
ReAct Configuration:
  - Max Steps: ${REACT_LOOP_CONFIG.maxSteps}
  - Max Tool Calls: ${REACT_LOOP_CONFIG.maxToolCalls}
  - Timeout: ${REACT_LOOP_CONFIG.timeoutMs}ms
  - Reflection: ${REACT_LOOP_CONFIG.enableReflection ? 'Enabled' : 'Disabled'}
  - Verbose Logging: ${REACT_LOOP_CONFIG.verboseLogging ? 'Enabled' : 'Disabled'}
  
Intent Triggers:
  - Always Use: ${REACT_INTENT_TRIGGERS.alwaysUseReAct.join(', ')}
  - Never Use: ${REACT_INTENT_TRIGGERS.neverUseReAct.join(', ')}
  - Low Confidence Threshold: ${REACT_INTENT_TRIGGERS.lowConfidenceThreshold}
  `;
}

// Export everything
export default {
  REACT_LOOP_CONFIG,
  REACT_INTENT_TRIGGERS,
  TOOL_SELECTION_STRATEGY,
  REASONING_DEPTH,
  REACT_LOGGING,
  shouldUseReAct,
  getRecommendedTools,
  getReasoningDepth,
  getReActConfigSummary
};
