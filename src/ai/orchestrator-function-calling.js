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
  
  console.log('\n' + '='.repeat(80));
  console.log('[StreamingFC] 🚀 NEW CONVERSATION TURN');
  console.log('[StreamingFC] User:', userId);
  console.log('[StreamingFC] Message:', message);
  console.log('[StreamingFC] Plan:', plan);
  console.log('[StreamingFC] History length:', conversationHistory.length);
  console.log('='.repeat(80) + '\n');
  
  try {
    // ============================================================
    // STEP 1: Build User Context
    // ============================================================
    console.log('\n[StreamingFC] 📊 STEP 1: Building user context...');
    const userContext = await buildMinimalContext(userId, message);
    console.log('[StreamingFC] ✅ Context built:');
    console.log('[StreamingFC]   - Profile loaded:', !!userContext.profile);
    console.log('[StreamingFC]   - Dietary preference:', userContext.profile?.dietaryPreference || 'not set');
    console.log('[StreamingFC]   - Location:', userContext.profile?.location || 'not set');
    console.log('[StreamingFC]   - Fitness goal:', userContext.profile?.fitnessGoal || 'not set');
    
    // ============================================================
    // STEP 2: Initialize Streaming LLM with Tools
    // ============================================================
    console.log('\n[StreamingFC] 🔧 STEP 2: Initializing LLM with tools...');
    const llm = createStreamingLLM(true);
    
    const tools = getGeminiFunctionDeclarations();
    console.log('[StreamingFC] ✅ Tools loaded:', tools.map(t => t.name).join(', '));
    
    const llmWithTools = llm.bind({
      tools: [{ functionDeclarations: tools }]
    });
    
    // ============================================================
    // STEP 3: Build Messages
    // ============================================================
    console.log('\n[StreamingFC] 💬 STEP 3: Building messages...');
    const systemPrompt = generateStreamingSystemPrompt(userContext, userId);
    console.log('[StreamingFC] ✅ System prompt generated (length:', systemPrompt.length, 'chars)');
    
    const chatHistory = buildChatHistory(conversationHistory);
    console.log('[StreamingFC] ✅ Chat history built:', chatHistory.length, 'messages');
    
    const messages = buildInitialMessages(systemPrompt, chatHistory, message);
    console.log('[StreamingFC] ✅ Total messages for LLM:', messages.length);
    
    // ============================================================
    // STEP 4: Start Streaming
    // ============================================================
    console.log('\n[StreamingFC] 📡 STEP 4: Starting stream...');
    let fullResponse = "";
    let llmCalls = 1;
    let toolsUsed = [];
    let lastWord = "";
    
    const stream = await llmWithTools.stream(messages);
    console.log('[StreamingFC] ✅ Stream initialized, processing chunks...');
    
    let currentChunk = null;
    let functionCall = null;
    let chunkCount = 0;
    
    // Process initial stream
    for await (const chunk of stream) {
      currentChunk = chunk;
      chunkCount++;
      functionCall = detectFunctionCall(chunk);
      
      if (functionCall) {
        console.log(`\n[StreamingFC] 🔧 Function call detected after ${chunkCount} chunks!`);
        console.log('[StreamingFC] 🎯 Tool:', functionCall.name);
        console.log('[StreamingFC] 📝 Args:', JSON.stringify(functionCall.args, null, 2));
        break;
      }
      
      const chunkText = extractChunkText(chunk);
      if (!chunkText) continue;
      
      fullResponse += chunkText;
      lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
    }
    
    console.log('[StreamingFC] 📊 Initial stream complete:');
    console.log('[StreamingFC]   - Chunks processed:', chunkCount);
    console.log('[StreamingFC]   - Response length:', fullResponse.length, 'chars');
    console.log('[StreamingFC]   - Function call detected:', !!functionCall);
    
    // ============================================================
    // STEP 5: Handle Function Calls Loop
    // ============================================================
    console.log('\n[StreamingFC] 🔄 STEP 5: Function calling loop...');
    const toolCallHistory = []; // Track tool calls with parameters
    let loopIteration = 0;
    
    while (functionCall) {
      loopIteration++;
      console.log(`\n[StreamingFC] 🔁 Loop iteration ${loopIteration}`);
      
      const toolName = functionCall.name;
      const toolArgs = functionCall.args;
      
      // Smart deduplication: Check if SAME tool with SAME parameters already called
      const isDuplicate = toolCallHistory.some(call => 
        call.name === toolName && 
        JSON.stringify(call.args) === JSON.stringify(toolArgs)
      );
      
      if (isDuplicate) {
        console.log(`[StreamingFC] ⚠️ Tool "${toolName}" with identical parameters already called - skipping duplicate`);
        console.log(`[StreamingFC] Previous calls:`, toolCallHistory.map(c => c.name).join(', '));
        
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
      console.log(`[StreamingFC] 🚀 Executing tool: ${toolName}`);
      console.log(`[StreamingFC] 📋 Parameters:`, JSON.stringify(toolArgs, null, 2));
      
      const toolStartTime = Date.now();
      const { toolName: executedToolName, toolResult } = await executeToolFunction(functionCall, userId);
      const toolDuration = Date.now() - toolStartTime;
      
      console.log(`[StreamingFC] ✅ Tool executed in ${toolDuration}ms`);
      console.log(`[StreamingFC] 📊 Result length:`, typeof toolResult === 'string' ? toolResult.length : JSON.stringify(toolResult).length, 'chars');
      
      toolsUsed.push(executedToolName);
      
      // Track tool call with parameters for smart deduplication
      toolCallHistory.push({
        name: executedToolName,
        args: toolArgs,
        result: toolResult,
        timestamp: Date.now(),
        duration: toolDuration
      });
      
      console.log(`[StreamingFC] 📝 Tool call history updated. Total calls: ${toolCallHistory.length}`);
      
      // Add messages for tool execution
      messages.push(currentChunk);
      messages.push(createToolMessage(toolResult, executedToolName, currentChunk));
      
      // Reset response buffer (discard incomplete thoughts)
      fullResponse = "";
      console.log('[StreamingFC] 🔄 Buffer reset - streaming fresh response after tool execution');
      
      // Resume streaming with tool results
      console.log('[StreamingFC] 📡 Resuming stream with tool results...');
      const resumeStream = await llmWithTools.stream(messages);
      llmCalls++;
      functionCall = null;
      chunkCount = 0;
      
      for await (const chunk of resumeStream) {
        currentChunk = chunk;
        chunkCount++;
        functionCall = detectFunctionCall(chunk);
        
        if (functionCall) {
          console.log(`\n[StreamingFC] 🔧 Another function call detected after ${chunkCount} chunks!`);
          console.log('[StreamingFC] 🎯 Tool:', functionCall.name);
          console.log('[StreamingFC] 📝 Args:', JSON.stringify(functionCall.args, null, 2));
          break;
        }
        
        const chunkText = extractChunkText(chunk);
        if (!chunkText) continue;
        
        fullResponse += chunkText;
        lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
      }
      
      console.log('[StreamingFC] 📊 Resume stream complete:');
      console.log('[StreamingFC]   - Chunks processed:', chunkCount);
      console.log('[StreamingFC]   - Response length:', fullResponse.length);
      console.log('[StreamingFC]   - Another function call:', !!functionCall);
    }
    
    // ============================================================
    // STEP 6: Finalize
    // ============================================================
    console.log('\n[StreamingFC] 🎬 STEP 6: Finalizing response...');
    await sendCompletionSignal(onChunk, fullResponse, lastWord);
    
    const timeTaken = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('[StreamingFC] ✅ CONVERSATION COMPLETE');
    console.log('[StreamingFC] ⏱️  Total time:', timeTaken, 'ms');
    console.log('[StreamingFC] 🔄 LLM calls:', llmCalls);
    console.log('[StreamingFC] 🔧 Tools used:', toolsUsed.join(', ') || 'none');
    console.log('[StreamingFC] 📏 Response length:', fullResponse.length, 'chars');
    console.log('[StreamingFC] 🔁 Function call loops:', loopIteration);
    if (toolCallHistory.length > 0) {
      console.log('[StreamingFC] 📊 Tool performance:');
      toolCallHistory.forEach(call => {
        console.log(`[StreamingFC]   - ${call.name}: ${call.duration}ms`);
      });
    }
    console.log('='.repeat(80) + '\n');
    
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
