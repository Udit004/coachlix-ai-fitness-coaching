// src/ai/streaming/messageBuilder.js
// Builds conversation messages for LLM

import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

/**
 * Build chat history from conversation history array
 * Limits to last 6 messages to save tokens
 * 
 * @param {Array} conversationHistory - Array of previous messages
 * @returns {Array} - Array of LangChain message objects
 */
export function buildChatHistory(conversationHistory) {
  const chatHistory = [];
  
  if (Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory.slice(-6)) {
      if (msg.role === "user") {
        chatHistory.push(new HumanMessage(msg.content));
      } else if (msg.role === "ai") {
        chatHistory.push(new AIMessage(msg.content));
      }
    }
  }
  
  return chatHistory;
}

/**
 * Build initial messages array for LLM conversation
 * Supports both text-only and multimodal content
 * @param {string} systemPrompt - System prompt with context
 * @param {Array} chatHistory - Previous chat messages
 * @param {string|Array} userMessage - Current user message (string or multimodal array)
 * @returns {Array} - Complete messages array for LLM
 */
export function buildInitialMessages(systemPrompt, chatHistory, userMessage) {
  // Handle multimodal content (array of parts)
  if (Array.isArray(userMessage)) {
    console.log('[MessageBuilder] Creating multimodal HumanMessage with', userMessage.length, 'parts');
    
    // For Google Gemini with LangChain, we need to pass content as an array
    return [
      new SystemMessage(systemPrompt),
      ...chatHistory,
      new HumanMessage({
        content: userMessage  // Pass the array directly as content
      })
    ];
  }
  
  // Handle text-only content (string)
  return [
    new SystemMessage(systemPrompt),
    ...chatHistory,
    new HumanMessage(userMessage)
  ];
}
