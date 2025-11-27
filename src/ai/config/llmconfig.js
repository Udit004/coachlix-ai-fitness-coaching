import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * LLM Configuration for Gemini 2.5 Flash with function calling
 */
export const LLM_CONFIG = {
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxOutputTokens: 1000,
  topP: 0.9,
  topK: 40,
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
};

/**
 * Create a ChatGoogleGenerativeAI instance with proper configuration
 * @param {boolean} streaming - Enable streaming mode
 * @param {Object} overrides - Override default config
 * @returns {ChatGoogleGenerativeAI}
 */
export function createStreamingLLM(streaming = true, overrides = {}) {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY?.trim(),
    model: LLM_CONFIG.model,
    temperature: LLM_CONFIG.temperature,
    maxOutputTokens: LLM_CONFIG.maxOutputTokens,
    topP: LLM_CONFIG.topP,
    topK: LLM_CONFIG.topK,
    streaming: streaming,
    ...overrides
  });
}