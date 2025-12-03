import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * LLM Configuration for Gemini 2.5 Flash with function calling
 */
export const LLM_CONFIG = {
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxOutputTokens: 2048,  // Increased for detailed recipes and comprehensive responses
  topP: 0.9,
  topK: 40,
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_ONLY_HIGH",  // Less restrictive for helpful content
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
      threshold: "BLOCK_ONLY_HIGH",  // Allow cooking instructions and recipes
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

/**
 * Create LLM with Google Search grounding enabled
 * Allows Gemini to search the internet for real-time information
 * 
 * @param {boolean} streaming - Enable streaming mode
 * @param {Object} searchConfig - Search grounding configuration
 * @returns {ChatGoogleGenerativeAI}
 */
export function createLLMWithSearch(streaming = true, searchConfig = {}) {
  const {
    threshold = 0.7,
    maxResults = 5
  } = searchConfig;
  
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY?.trim(),
    model: LLM_CONFIG.model,
    temperature: LLM_CONFIG.temperature,
    maxOutputTokens: LLM_CONFIG.maxOutputTokens,
    topP: LLM_CONFIG.topP,
    topK: LLM_CONFIG.topK,
    streaming: streaming,
    // Enable Google Search grounding
    tools: [{
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: 'MODE_DYNAMIC',
          dynamicThreshold: threshold
        }
      }
    }]
  });
}