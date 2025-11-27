// src/ai/orchestrator-function-calling.js
// ARCHITECTURE: TRUE STREAMING Function Calling with Pause/Resume
// 
// This file orchestrates the main streaming conversation flow with function calling.
// Heavy lifting is delegated to modular utilities in /streaming folder.
//
// FLOW:
// 1. Build context → 2. Initialize LLM → 3. Stream response
// 4. Detect function calls → 5. Execute tools → 6. Resume stream
//
// KEY FEATURES:
// ✅ TRUE streaming using Gemini's native .stream() API
// ✅ Real-time token delivery (50-200ms time-to-first-token)
// ✅ Function calling works mid-stream with pause/resume
// ✅ Deduplication prevents redundant tool calls
// ✅ Modular architecture for easy maintenance

import { buildMinimalContext } from "./search/contextRetrieval";
import { getGeminiFunctionDeclarations } from "./function-declarations";
import { createStreamingLLM } from "./config/llmconfig";
import { generateStreamingSystemPrompt } from "./prompts/systemPrompts";
import {
  buildChatHistory,
  buildInitialMessages,
  detectFunctionCall,
  isToolAlreadyUsed,
  executeToolFunction,
  createToolMessage,
  extractChunkText,
  streamTextToFrontend,
  sendCompletionSignal
} from "./streaming";

/**
 * Stream chat message processing with TRUE Gemini streaming and function calling
 * 
 * @param {Object} params - { message, userId, plan, profile, conversationHistory }
 * @param {Function} onChunk - Callback for real-time streaming: (chunk) => void
 * @returns {Promise<Object>} - { response, metadata }
 */
export async function processChatMessageWithFunctionCallingStreaming(params, onChunk) {
  const { message, userId, plan = "general", profile = null, conversationHistory = [] } = params;
  const startTime = Date.now();
  
  console.log('[StreamingFC] Starting TRUE streaming with function calling...');
  console.log('[StreamingFC] Message:', message.substring(0, 100));
  
  try {
    // ============================================================
    // STEP 1: Build User Context
    // ============================================================
    const userContext = await buildMinimalContext(userId, message);
    console.log('[StreamingFC] Context built - Profile loaded:', !!userContext.profile);
    
    // ============================================================
    // STEP 2: Initialize Streaming LLM with Tools
    // ============================================================
    const llm = createStreamingLLM(true);
    
    const tools = getGeminiFunctionDeclarations();
    const llmWithTools = llm.bind({
      tools: [{ functionDeclarations: tools }]
    });
    
    // ============================================================
    // STEP 3: Build Messages
    // ============================================================
    const systemPrompt = generateStreamingSystemPrompt(userContext, userId);
    const chatHistory = buildChatHistory(conversationHistory);
    const messages = buildInitialMessages(systemPrompt, chatHistory, message);
    
    // ============================================================
    // STEP 4: Start Streaming
    // ============================================================
    let fullResponse = "";
    let llmCalls = 1;
    let toolsUsed = [];
    let lastWord = "";
    
    const stream = await llmWithTools.stream(messages);
    
    let currentChunk = null;
    let functionCall = null;
    
    // Process initial stream
    for await (const chunk of stream) {
      currentChunk = chunk;
      functionCall = detectFunctionCall(chunk);
      
      if (functionCall) {
        console.log('[StreamingFC] 🔧 Function call detected, pausing stream...');
        break;
      }
      
      const chunkText = extractChunkText(chunk);
      if (!chunkText) continue;
      
      fullResponse += chunkText;
      lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
    }
    
    console.log('[StreamingFC] Initial stream - Response length:', fullResponse.length);
    
    // ============================================================
    // STEP 5: Handle Function Calls Loop
    // ============================================================
    while (functionCall) {
      const toolName = functionCall.name;
      
      // Check for duplicate tool calls
      if (isToolAlreadyUsed(toolName, toolsUsed)) {
        console.log(`[StreamingFC] ⚠️ Tool "${toolName}" already called - skipping duplicate`);
        
        // Resume stream to check for next tool or get final response
        const resumeStream = await llmWithTools.stream(messages);
        llmCalls++;
        functionCall = null;
        
        for await (const chunk of resumeStream) {
          currentChunk = chunk;
          functionCall = detectFunctionCall(chunk);
          
          if (functionCall) {
            console.log('[StreamingFC] 🔧 Another function call detected...');
            break;
          }
          
          const chunkText = extractChunkText(chunk);
          if (!chunkText) continue;
          
          fullResponse += chunkText;
          lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
        }
        
        continue;
      }
      
      // Execute tool
      const { toolName: executedToolName, toolResult } = await executeToolFunction(functionCall, userId);
      toolsUsed.push(executedToolName);
      
      // Add messages for tool execution
      messages.push(currentChunk);
      messages.push(createToolMessage(toolResult, executedToolName, currentChunk));
      
      // Reset response buffer (discard incomplete thoughts)
      fullResponse = "";
      console.log('[StreamingFC] Reset buffer - streaming fresh response after tool execution');
      
      // Resume streaming with tool results
      const resumeStream = await llmWithTools.stream(messages);
      llmCalls++;
      functionCall = null;
      
      for await (const chunk of resumeStream) {
        currentChunk = chunk;
        functionCall = detectFunctionCall(chunk);
        
        if (functionCall) {
          console.log('[StreamingFC] 🔧 Another function call detected...');
          break;
        }
        
        const chunkText = extractChunkText(chunk);
        if (!chunkText) continue;
        
        fullResponse += chunkText;
        lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
      }
    }
    
    // ============================================================
    // STEP 6: Finalize
    // ============================================================
    await sendCompletionSignal(onChunk, fullResponse, lastWord);
    
    const timeTaken = Date.now() - startTime;
    console.log(`[StreamingFC] ✅ Complete - ${timeTaken}ms, ${llmCalls} calls, Tools: ${toolsUsed.join(', ') || 'none'}`);
    
    return {
      response: fullResponse,
      metadata: {
        llmCalls,
        timeTaken,
        toolsUsed,
        architecture: 'function_calling_streaming',
        streamingType: 'true',
        responseLength: fullResponse.length
      }
    };
    
  } catch (error) {
    console.error('[StreamingFC] Error:', error);
    
    return {
      response: "I'm having trouble processing your request right now. Please try again in a moment.",
      metadata: {
        error: error.message,
        llmCalls: 0,
        timeTaken: Date.now() - startTime,
        architecture: 'function_calling_streaming'
      }
    };
  }
}
