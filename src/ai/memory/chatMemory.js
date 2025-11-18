// src/ai/memory/chatMemory.js
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { connectDB } from "../../lib/db";
import mongoose from "mongoose";

/**
 * Creates a MongoDB chat message history instance for persistent memory
 * @param {string} sessionId - Firebase Auth user ID
 * @param {string} collectionName - MongoDB collection name for chat history
 * @returns {MongoDBChatMessageHistory} LangChain memory instance
 */
export async function createChatMemory(sessionId, collectionName = "chat_memory") {
  if (!sessionId) {
    throw new Error("Session ID (user ID) is required for chat memory");
  }

  try {
    // Ensure database connection
    await connectDB();
    
    // Create MongoDB chat message history
    const chatHistory = new MongoDBChatMessageHistory({
      collection: mongoose.connection.db.collection(collectionName),
      sessionId: sessionId,
    });

    return chatHistory;
  } catch (error) {
    console.error("Error creating chat memory:", error);
    throw new Error("Failed to initialize chat memory");
  }
}

/**
 * Retrieves recent chat history for context
 * @param {string} sessionId - Firebase Auth user ID
 * @param {number} limit - Number of recent message pairs to retrieve
 * @returns {Array} Array of message objects
 */
export async function getRecentChatHistory(sessionId, limit = 10) {
  try {
    const chatHistory = await createChatMemory(sessionId);
    const messages = await chatHistory.getMessages();
    
    // Return the most recent messages (limit * 2 for pairs)
    return messages.slice(-(limit * 2));
  } catch (error) {
    console.error("Error retrieving chat history:", error);
    return []; // Return empty array on error to not break the chat
  }
}

/**
 * Adds messages to chat history
 * @param {string} sessionId - Firebase Auth user ID
 * @param {Array} messages - Array of message objects to add
 */
export async function addToHistory(sessionId, messages) {
  try {
    const chatHistory = await createChatMemory(sessionId);
    
    for (const message of messages) {
      if (message.role === 'user') {
        await chatHistory.addUserMessage(message.content);
      } else if (message.role === 'ai' || message.role === 'assistant') {
        await chatHistory.addAIMessage(message.content);
      }
    }
  } catch (error) {
    console.error("Error adding to history:", error);
    // Don't throw error to prevent breaking the chat flow
  }
}

/**
 * Clears chat history for a session
 * @param {string} sessionId - Firebase Auth user ID
 */
export async function clearChatHistory(sessionId) {
  try {
    const chatHistory = await createChatMemory(sessionId);
    await chatHistory.clear();
    return true;
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return false;
  }
}

/**
 * Formats chat history for context in prompts
 * @param {Array} messages - Array of message objects from LangChain
 * @param {number} maxLength - Maximum character length for context
 * @returns {string} Formatted conversation history
 */
export function formatChatHistoryForContext(messages, maxLength = 2000) {
  if (!messages || messages.length === 0) {
    return "";
  }

  let context = "\n\nRecent conversation history:\n";
  let currentLength = context.length;

  // Start from the most recent messages and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const formattedMessage = `${message._getType()}: ${message.content}\n`;
    
    if (currentLength + formattedMessage.length > maxLength) {
      break;
    }
    
    context = context + formattedMessage;
    currentLength += formattedMessage.length;
  }

  return context.length > 50 ? context : ""; // Only return if we have meaningful context
}
