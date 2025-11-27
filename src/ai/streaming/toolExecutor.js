// src/ai/streaming/toolExecutor.js
// Handles tool execution during streaming

import { getToolByName } from "../tools";
import { ToolMessage } from "@langchain/core/messages";

/**
 * Execute a tool function with given arguments
 * @param {Object} functionCall - Function call object from LLM
 * @param {string} userId - User ID to inject into tool args
 * @returns {Promise<{toolName: string, toolResult: any}>}
 */
export async function executeToolFunction(functionCall, userId) {
  const toolName = functionCall.name;
  const toolArgs = functionCall.args || JSON.parse(functionCall.arguments || '{}');
  
  console.log('[ToolExecutor] Tool requested:', toolName);
  console.log('[ToolExecutor] Tool args:', toolArgs);
  
  // Ensure userId is in arguments
  if (!toolArgs.userId) {
    toolArgs.userId = userId;
  }
  
  // Get and execute the tool function
  const toolFunction = getToolByName(toolName);
  let toolResult;
  
  if (!toolFunction) {
    console.error('[ToolExecutor] ❌ Tool not found:', toolName);
    toolResult = `Error: Tool "${toolName}" is not available.`;
  } else {
    try {
      console.log('[ToolExecutor] Executing tool...');
      toolResult = await toolFunction(toolArgs);
      console.log('[ToolExecutor] ✅ Tool executed successfully');
    } catch (error) {
      console.error('[ToolExecutor] ❌ Tool execution error:', error);
      toolResult = `Error executing tool: ${error.message}`;
    }
  }
  
  return { toolName, toolResult };
}

/**
 * Create a ToolMessage for LangChain from tool execution result
 * @param {any} toolResult - Result from tool execution
 * @param {string} toolName - Name of the executed tool
 * @param {Object} currentChunk - Current chunk containing tool call ID
 * @returns {ToolMessage}
 */
export function createToolMessage(toolResult, toolName, currentChunk) {
  return new ToolMessage({
    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
    tool_call_id: currentChunk.additional_kwargs?.tool_calls?.[0]?.id || toolName,
    name: toolName
  });
}
