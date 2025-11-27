// src/ai/utils/parseModelJson.js
// Utility for safely parsing JSON responses from LLM
// Handles edge cases like markdown code blocks, incomplete JSON, etc.

/**
 * Safely parse JSON from LLM response
 * Handles common LLM output issues:
 * - Markdown code blocks (```json ... ```)
 * - Extra text before/after JSON
 * - Escaped characters
 * - Malformed JSON
 * 
 * @param {string} text - Raw LLM response text
 * @returns {Object|null} Parsed JSON object or null if parsing fails
 */
export function parseModelJson(text) {
  if (!text || typeof text !== 'string') {
    console.error('[parseModelJson] Invalid input: text is not a string');
    return null;
  }

  try {
    // Step 1: Remove markdown code blocks
    let cleaned = text.trim();
    
    // Remove ```json and ``` markers
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    // Step 2: Extract JSON object if text contains extra content
    // Look for content between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      console.error('[parseModelJson] No valid JSON object found in text');
      return null;
    }
    
    // Step 3: Parse JSON
    const parsed = JSON.parse(cleaned);
    
    // Step 4: Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('[parseModelJson] Parsed result is not an object');
      return null;
    }
    
    return parsed;
    
  } catch (error) {
    console.error('[parseModelJson] Failed to parse JSON:', error.message);
    console.error('[parseModelJson] Original text:', text.substring(0, 200));
    return null;
  }
}

/**
 * Parse and validate tool call response from first LLM call
 * Expected format:
 * {
 *   "needs_tool": boolean,
 *   "tool_name": string | null,
 *   "tool_args": object | null,
 *   "assistant_response": string | null
 * }
 * 
 * @param {string} text - Raw LLM response
 * @returns {Object} Validated tool call object with defaults
 */
export function parseToolCallResponse(text) {
  const parsed = parseModelJson(text);
  
  if (!parsed) {
    // Fallback: treat as direct response
    console.warn('[parseToolCallResponse] Failed to parse JSON, treating as direct response');
    return {
      needs_tool: false,
      tool_name: null,
      tool_args: null,
      assistant_response: text || "I'm having trouble processing your request right now."
    };
  }
  
  // Validate and set defaults
  const result = {
    needs_tool: parsed.needs_tool === true,
    tool_name: parsed.tool_name || null,
    tool_args: parsed.tool_args || null,
    assistant_response: parsed.assistant_response || null
  };
  
  // Validation: if needs_tool is true, must have tool_name
  if (result.needs_tool && !result.tool_name) {
    console.warn('[parseToolCallResponse] needs_tool is true but tool_name is missing');
    return {
      needs_tool: false,
      tool_name: null,
      tool_args: null,
      assistant_response: parsed.assistant_response || "I need more information to help you with that."
    };
  }
  
  // Validation: if needs_tool is false, must have assistant_response
  if (!result.needs_tool && !result.assistant_response) {
    console.warn('[parseToolCallResponse] needs_tool is false but assistant_response is missing');
    result.assistant_response = "I understand your request, but I need more context to provide a helpful response.";
  }
  
  return result;
}

/**
 * Fallback parser using regex to extract JSON
 * Used when standard JSON.parse fails
 * 
 * @param {string} text - Raw text
 * @returns {Object|null} Extracted JSON or null
 */
export function fallbackJsonExtract(text) {
  try {
    // Try to find JSON patterns
    const patterns = [
      /\{[\s\S]*"needs_tool"[\s\S]*\}/i,
      /\{[\s\S]*"tool_name"[\s\S]*\}/i,
      /\{[^{}]*\}/g
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e) {
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate tool arguments object
 * Ensures required fields are present based on tool name
 * 
 * @param {string} toolName - Name of the tool
 * @param {Object} toolArgs - Tool arguments
 * @returns {boolean} True if valid
 */
export function validateToolArgs(toolName, toolArgs) {
  if (!toolArgs || typeof toolArgs !== 'object') {
    return false;
  }
  
  // Define required fields for each tool
  const requiredFields = {
    'create_diet_plan': ['userId'],
    'update_diet_plan': ['userId'],
    'update_workout_plan': ['userId'],
    'nutrition_lookup': ['foodName'],
    'calculate_health_metrics': ['userId']
  };
  
  const required = requiredFields[toolName];
  if (!required) {
    // Unknown tool, assume valid
    return true;
  }
  
  // Check all required fields are present
  return required.every(field => toolArgs[field] !== undefined && toolArgs[field] !== null);
}
