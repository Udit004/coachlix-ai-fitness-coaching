// src/ai/streaming/functionCallDetector.js
// Detects function calls in streaming chunks from Gemini

/**
 * Detect if a stream chunk contains a function call request
 * Supports multiple Gemini response formats
 * 
 * @param {Object} chunk - Stream chunk from Gemini
 * @returns {Object|null} - Function call object or null if none found
 */
export function detectFunctionCall(chunk) {
  let functionCall = null;
  
  // Check additional_kwargs first (older format)
  if (chunk.additional_kwargs?.function_call) {
    functionCall = chunk.additional_kwargs.function_call;
  } else if (chunk.additional_kwargs?.tool_calls?.[0]) {
    functionCall = chunk.additional_kwargs.tool_calls[0].function;
  }
  // Check content array for Gemini's new format
  // Important: Check ALL items, not just first, as Gemini can return [text, functionCall]
  else if (Array.isArray(chunk.content)) {
    for (const item of chunk.content) {
      if (item?.functionCall) {
        functionCall = item.functionCall;
        console.log('[FunctionCallDetector] Found function call in content array');
        break;
      }
    }
  }
  
  return functionCall;
}

/**
 * Check if a tool has already been used (prevents duplicates)
 * @param {string} toolName - Name of the tool to check
 * @param {Array<string>} toolsUsed - Array of already-used tool names
 * @returns {boolean} - True if tool was already used
 */
export function isToolAlreadyUsed(toolName, toolsUsed) {
  return toolsUsed.includes(toolName);
}
