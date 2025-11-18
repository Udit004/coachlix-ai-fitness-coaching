import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function createLLM(streaming = false) {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "gemini-1.5-flash",
    temperature: 0.7,
    maxOutputTokens: streaming ? 2048 : 8192,
    streaming: streaming,
  });
}

export const LLM_CONFIG = {
  modelName: "gemini-1.5-flash",
  temperature: 0.7,
  maxOutputTokens: 8192,
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