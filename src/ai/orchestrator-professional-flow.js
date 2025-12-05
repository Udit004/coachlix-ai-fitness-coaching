// src/ai/orchestrator-professional-flow.js
// PROFESSIONAL CONVERSATIONAL FLOW ORCHESTRATOR
// 
// Implements the complete professional AI flow:
// User Message → Intent Classification → Semantic Memory (RAG) → 
// Chain-of-Thought Reasoning → Response Generation → Self-Critique → Refined Response
//
// This creates a chatbot experience that feels like talking to a professional coach
// who thinks carefully before responding.

import { analyzeIntent } from "./reasoning/intentClassifier";
import { performReasoning, formatReasoningSummary } from "./reasoning/chainOfThought";
import { validateResponse, applyAutomatedFixes, formatValidationSummary } from "./reasoning/responseValidator";
import { buildSmartContext, getContextStats } from "./search/semanticMemoryRetrieval";
import { generateProfessionalSystemPrompt } from "./prompts/systemPrompts";
import { generateOptimizedSystemPrompt } from "./prompts/dynamicPromptBuilder";
import { createStreamingLLM, createLLMWithSearch } from "./config/llmconfig";
import { shouldEnableSearch, logSearchUsage, getSearchGroundingConfig } from "./config/searchGrounding";
import { getGeminiFunctionDeclarations } from "./function-declarations";
import {
  buildChatHistory,
  buildInitialMessages,
  detectFunctionCall,
  executeToolFunction,
  createToolMessage,
  extractChunkText,
  streamTextToFrontend,
  sendCompletionSignal
} from "./streaming";

/**
 * Professional Flow Configuration
 */
const PROFESSIONAL_FLOW_CONFIG = {
  enableIntentClassification: true,
  enableChainOfThought: true,
  enableResponseValidation: true,
  enableSemanticRAG: true,
  
  // Google Search Grounding (NEW!)
  enableGoogleSearch: true,           // Master switch for search grounding
  searchThreshold: 0.7,                // Confidence threshold for using search results
  removeRedundantTools: true,          // Remove tools redundant with search (e.g., nutrition_lookup)
  
  // Dynamic Prompt Optimization (NEW!)
  enableDynamicPrompts: true,          // Use intent-based prompt optimization
  fallbackToFullPrompt: false,         // Use full prompt if dynamic fails
  
  // Validation settings
  skipLLMValidationForSimpleQueries: false, // Save cost/time on greetings
  autoFixEnabled: true,
  
  // Performance settings
  useFastReasoningForSimpleIntents: true,
  maxValidationRetries: 2
};

/**
 * Main Professional Flow Orchestrator
 * Processes chat with full reasoning pipeline while maintaining streaming
 * 
 * @param {Object} params - { message, userId, plan, profile, conversationHistory }
 * @param {Function} onChunk - Streaming callback: (chunk) => void
 * @returns {Promise<Object>} - { response, metadata }
 */
export async function processChatWithProfessionalFlow(params, onChunk) {
  const { message, userId, plan = "general", profile = null, conversationHistory = [] } = params;
  const startTime = Date.now();
  const flowMetrics = {
    intentClassificationTime: 0,
    contextRetrievalTime: 0,
    reasoningTime: 0,
    llmCalls: 0,
    validationTime: 0,
    totalTime: 0
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('[ProfessionalFlow] 🎓 STARTING PROFESSIONAL CONVERSATION FLOW');
  console.log('[ProfessionalFlow] User:', userId);
  console.log('[ProfessionalFlow] Message:', message);
  console.log('[ProfessionalFlow] History length:', conversationHistory.length);
  console.log('='.repeat(80) + '\n');
  
  try {
    // ============================================================
    // STEP 1: INTENT CLASSIFICATION
    // ============================================================
    console.log('[ProfessionalFlow] 📍 STEP 1: Intent Classification...');
    const intentStart = Date.now();
    
    const intent = analyzeIntent(message, {
      profile,
      conversationHistory,
      hasDietPlan: !!profile?.activeDietPlan,
      hasWorkoutPlan: !!profile?.activeWorkoutPlan
    });
    
    flowMetrics.intentClassificationTime = Date.now() - intentStart;
    
    console.log('[ProfessionalFlow] ✅ Intent:', intent.intent);
    console.log('[ProfessionalFlow] Confidence:', (intent.confidence * 100).toFixed(0) + '%');
    console.log('[ProfessionalFlow] Requires Data:', intent.requiresData);
    console.log('[ProfessionalFlow] Priority:', intent.dataNeeds.priority);
    
    // ============================================================
    // STEP 2: SEMANTIC MEMORY RETRIEVAL (RAG)
    // ============================================================
    console.log('\n[ProfessionalFlow] 📚 STEP 2: Semantic Memory Retrieval (RAG)...');
    const ragStart = Date.now();
    
    const userContext = await buildSmartContext(userId, message, intent);
    
    flowMetrics.contextRetrievalTime = Date.now() - ragStart;
    
    const contextStats = getContextStats(userContext);
    console.log('[ProfessionalFlow] ✅ Context built:');
    console.log('[ProfessionalFlow]   - Profile:', contextStats.hasProfile ? '✓' : '✗');
    console.log('[ProfessionalFlow]   - Diet Plan:', contextStats.hasDiet ? '✓' : '✗');
    console.log('[ProfessionalFlow]   - Workout Plan:', contextStats.hasWorkout ? '✓' : '✗');
    console.log('[ProfessionalFlow]   - History:', contextStats.historyCount, 'messages');
    console.log('[ProfessionalFlow]   - Total length:', contextStats.totalLength, 'chars');
    
    // ============================================================
    // STEP 3: CHAIN-OF-THOUGHT REASONING
    // ============================================================
    console.log('\n[ProfessionalFlow] 🧠 STEP 3: Chain-of-Thought Reasoning...');
    const reasoningStart = Date.now();
    
    let reasoning = null;
    if (PROFESSIONAL_FLOW_CONFIG.enableChainOfThought) {
      reasoning = await performReasoning({
        message,
        intent,
        userContext,
        dataNeeds: intent.dataNeeds
      });
      
      flowMetrics.reasoningTime = Date.now() - reasoningStart;
      
      if (reasoning.isFastPath) {
        console.log('[ProfessionalFlow] ⚡ Used fast reasoning path');
      } else {
        console.log('[ProfessionalFlow] ✅ Full reasoning complete');
        console.log('[ProfessionalFlow]   - Key points:', reasoning.keyPoints?.length || 0);
        console.log('[ProfessionalFlow]   - Concerns:', reasoning.concerns?.length || 0);
      }
      
      // Log detailed reasoning for debugging
      if (!reasoning.isFastPath) {
        console.log(formatReasoningSummary(reasoning));
      }
    }
    
    // ============================================================
    // STEP 4: LLM INITIALIZATION & RESPONSE GENERATION
    // ============================================================
    console.log('\n[ProfessionalFlow] 🤖 STEP 4: Response Generation...');
    
    // Determine if Google Search should be enabled
    const enableSearch = PROFESSIONAL_FLOW_CONFIG.enableGoogleSearch && 
                         shouldEnableSearch(intent, message);
    
    logSearchUsage(userId, intent, enableSearch);
    
    // Create LLM with or without search grounding
    let llm;
    if (enableSearch) {
      const searchConfig = getSearchGroundingConfig({
        threshold: PROFESSIONAL_FLOW_CONFIG.searchThreshold
      });
      llm = createLLMWithSearch(true, searchConfig);
      console.log('[ProfessionalFlow] 🌐 Google Search grounding ENABLED');
    } else {
      llm = createStreamingLLM(true);
      console.log('[ProfessionalFlow] ⚡ Using standard LLM (no search)');
    }
    
    // Smart tool selection: Skip redundant tools when search is enabled
    const tools = getGeminiFunctionDeclarations();
    let filteredTools = tools;
    
    if (enableSearch && PROFESSIONAL_FLOW_CONFIG.removeRedundantTools) {
      // Remove nutrition_lookup tool since Google Search provides nutrition data
      filteredTools = tools.filter(tool => tool.name !== 'nutrition_lookup');
      console.log('[ProfessionalFlow] 🔧 Removed nutrition_lookup tool (using Google Search instead)');
      console.log('[ProfessionalFlow] 📊 Available tools:', filteredTools.map(t => t.name).join(', '));
    }
    
    const llmWithTools = llm.bind({
      tools: [{ functionDeclarations: filteredTools }]
    });
    
    // Generate optimized system prompt based on intent and user context
    let systemPrompt;
    if (PROFESSIONAL_FLOW_CONFIG.enableDynamicPrompts) {
      systemPrompt = generateOptimizedSystemPrompt(
        intent,
        userContext, 
        userId, 
        reasoning
      );
      console.log('[ProfessionalFlow] 📝 Using DYNAMIC system prompt (optimized for intent)');
    } else {
      systemPrompt = generateProfessionalSystemPrompt(
        userContext, 
        userId, 
        reasoning
      );
      console.log('[ProfessionalFlow] 📝 Using FULL system prompt');
    }
    
    const chatHistory = buildChatHistory(conversationHistory);
    const messages = buildInitialMessages(systemPrompt, chatHistory, message);
    
    console.log('[ProfessionalFlow] ✅ LLM initialized with', filteredTools.length, 'tools');
    if (enableSearch) {
      console.log('[ProfessionalFlow] 🔍 Search will provide: nutrition data, recipes, restaurants, trends');
      console.log('[ProfessionalFlow] ⚡ Tools optimized: nutrition_lookup removed (redundant with search)');
    }
    
    // ============================================================
    // STEP 5: STREAMING WITH FUNCTION CALLING
    // ============================================================
    console.log('\n[ProfessionalFlow] 📡 STEP 5: Streaming response...');
    
    let fullResponse = "";
    let llmCalls = 1;
    let toolsUsed = [];
    let lastWord = "";
    
    const stream = await llmWithTools.stream(messages);
    let currentChunk = null;
    let functionCall = null;
    let chunkCount = 0;
    
    // Process initial stream
    for await (const chunk of stream) {
      currentChunk = chunk;
      chunkCount++;
      functionCall = detectFunctionCall(chunk);
      
      if (functionCall) {
        console.log(`[ProfessionalFlow] 🔧 Function call detected: ${functionCall.name}`);
        break;
      }
      
      const chunkText = extractChunkText(chunk);
      if (!chunkText) continue;
      
      fullResponse += chunkText;
      lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
    }
    
    // Handle function calls (if any)
    const toolCallHistory = [];
    let loopIteration = 0;
    
    while (functionCall) {
      loopIteration++;
      const toolName = functionCall.name;
      const toolArgs = functionCall.args;
      
      // Smart deduplication
      const isDuplicate = toolCallHistory.some(call => 
        call.name === toolName && 
        JSON.stringify(call.args) === JSON.stringify(toolArgs)
      );
      
      if (isDuplicate) {
        console.log(`[ProfessionalFlow] ⚠️ Skipping duplicate tool call: ${toolName}`);
        const resumeStream = await llmWithTools.stream(messages);
        llmCalls++;
        functionCall = null;
        
        for await (const chunk of resumeStream) {
          currentChunk = chunk;
          functionCall = detectFunctionCall(chunk);
          if (functionCall) break;
          
          const chunkText = extractChunkText(chunk);
          if (!chunkText) continue;
          
          fullResponse += chunkText;
          lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
        }
        continue;
      }
      
      // Execute tool
      console.log(`[ProfessionalFlow] 🚀 Executing tool: ${toolName}`);
      const toolStartTime = Date.now();
      const { toolName: executedToolName, toolResult } = await executeToolFunction(functionCall, userId);
      const toolDuration = Date.now() - toolStartTime;
      
      console.log(`[ProfessionalFlow] ✅ Tool executed in ${toolDuration}ms`);
      
      toolsUsed.push(executedToolName);
      toolCallHistory.push({
        name: executedToolName,
        args: toolArgs,
        result: toolResult,
        timestamp: Date.now(),
        duration: toolDuration
      });
      
      // Add messages for tool execution
      messages.push(currentChunk);
      messages.push(createToolMessage(toolResult, executedToolName, currentChunk));
      
      // Reset response buffer
      fullResponse = "";
      
      // Resume streaming
      const resumeStream = await llmWithTools.stream(messages);
      llmCalls++;
      functionCall = null;
      chunkCount = 0;
      
      for await (const chunk of resumeStream) {
        currentChunk = chunk;
        chunkCount++;
        functionCall = detectFunctionCall(chunk);
        
        if (functionCall) {
          console.log(`[ProfessionalFlow] 🔧 Another function call: ${functionCall.name}`);
          break;
        }
        
        const chunkText = extractChunkText(chunk);
        if (!chunkText) continue;
        
        fullResponse += chunkText;
        lastWord = await streamTextToFrontend(chunkText, fullResponse, onChunk);
      }
    }
    
    flowMetrics.llmCalls = llmCalls;
    
    console.log('[ProfessionalFlow] ✅ Response generation complete');
    console.log('[ProfessionalFlow]   - LLM calls:', llmCalls);
    console.log('[ProfessionalFlow]   - Tools used:', toolsUsed.join(', ') || 'none');
    console.log('[ProfessionalFlow]   - Response length:', fullResponse.length);
    
    // ============================================================
    // STEP 6: RESPONSE VALIDATION & SELF-CRITIQUE
    // ============================================================
    console.log('\n[ProfessionalFlow] 🔍 STEP 6: Response Validation...');
    const validationStart = Date.now();
    
    let validation = null;
    let improvedResponse = fullResponse;
    
    if (PROFESSIONAL_FLOW_CONFIG.enableResponseValidation) {
      // Skip expensive LLM validation for simple greetings
      const skipLLMValidation = 
        PROFESSIONAL_FLOW_CONFIG.skipLLMValidationForSimpleQueries &&
        intent.intent === 'greeting' &&
        intent.confidence > 0.85;
      
      validation = await validateResponse({
        response: fullResponse,
        message,
        intent,
        userContext,
        reasoning,
        skipLLMValidation
      });
      
      flowMetrics.validationTime = Date.now() - validationStart;
      
      console.log('[ProfessionalFlow] ✅ Validation complete');
      console.log('[ProfessionalFlow]   - Verdict:', validation.verdict);
      console.log('[ProfessionalFlow]   - Score:', validation.overallScore + '/10');
      
      // Log detailed validation results
      console.log(formatValidationSummary(validation));
      
      // Apply automated fixes if enabled and issues found
      if (PROFESSIONAL_FLOW_CONFIG.autoFixEnabled && 
          (validation.verdict === 'NEEDS_REVISION' || validation.verdict === 'CRITICAL_REVISION')) {
        console.log('[ProfessionalFlow] 🔧 Applying automated fixes...');
        improvedResponse = applyAutomatedFixes(fullResponse, validation);
        
        if (improvedResponse !== fullResponse) {
          console.log('[ProfessionalFlow] ✅ Response improved with auto-fixes');
        }
      }
      
      // If critical issues and auto-fix didn't resolve, we might want to regenerate
      // For now, we'll use the improved response
    }
    
    // ============================================================
    // STEP 7: FINALIZE & SEND COMPLETION
    // ============================================================
    console.log('\n[ProfessionalFlow] 🎬 STEP 7: Finalizing...');
    
    await sendCompletionSignal(onChunk, improvedResponse, lastWord);
    
    flowMetrics.totalTime = Date.now() - startTime;
    
    // ============================================================
    // SUMMARY & METRICS
    // ============================================================
    console.log('\n' + '='.repeat(80));
    console.log('[ProfessionalFlow] ✅ PROFESSIONAL FLOW COMPLETE');
    console.log('[ProfessionalFlow] 📊 PERFORMANCE METRICS:');
    console.log('[ProfessionalFlow]   - Intent Classification:', flowMetrics.intentClassificationTime, 'ms');
    console.log('[ProfessionalFlow]   - Context Retrieval (RAG):', flowMetrics.contextRetrievalTime, 'ms');
    console.log('[ProfessionalFlow]   - Reasoning (CoT):', flowMetrics.reasoningTime, 'ms');
    console.log('[ProfessionalFlow]   - LLM Calls:', flowMetrics.llmCalls);
    console.log('[ProfessionalFlow]   - Response Validation:', flowMetrics.validationTime, 'ms');
    console.log('[ProfessionalFlow]   - Total Time:', flowMetrics.totalTime, 'ms');
    console.log('[ProfessionalFlow] 📈 QUALITY METRICS:');
    console.log('[ProfessionalFlow]   - Intent Confidence:', (intent.confidence * 100).toFixed(0) + '%');
    console.log('[ProfessionalFlow]   - Validation Score:', validation?.overallScore || 'N/A', '/10');
    console.log('[ProfessionalFlow]   - Response Length:', improvedResponse.length, 'chars');
    console.log('[ProfessionalFlow]   - Auto-fixes Applied:', improvedResponse !== fullResponse ? 'Yes' : 'No');
    console.log('[ProfessionalFlow]   - Google Search Used:', enableSearch ? 'Yes' : 'No');
    console.log('='.repeat(80) + '\n');
    
    return {
      response: improvedResponse,
      metadata: {
        // Flow metadata
        architecture: 'professional_flow',
        flowVersion: '1.0',
        
        // Intent data
        intent: intent.intent,
        intentConfidence: intent.confidence,
        requiresData: intent.requiresData,
        priority: intent.dataNeeds.priority,
        
        // Context data
        contextStats,
        
        // Search data (NEW!)
        googleSearchEnabled: enableSearch,
        searchReason: enableSearch ? `Intent: ${intent.intent}` : 'Not needed',
        
        // Reasoning data
        reasoningEnabled: !!reasoning,
        reasoningPath: reasoning?.isFastPath ? 'fast' : 'full',
        keyPoints: reasoning?.keyPoints || [],
        
        // Generation data
        llmCalls: flowMetrics.llmCalls,
        toolsUsed,
        toolCallCount: toolCallHistory.length,
        
        // Validation data
        validationEnabled: !!validation,
        validationScore: validation?.overallScore || null,
        validationVerdict: validation?.verdict || null,
        autoFixApplied: improvedResponse !== fullResponse,
        
        // Performance data
        timings: flowMetrics,
        responseLength: improvedResponse.length,
        
        // Timestamps
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('[ProfessionalFlow] ❌ Error:', error);
    
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      metadata: {
        architecture: 'professional_flow',
        error: error.message,
        llmCalls: 0,
        timeTaken: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
  }
}
