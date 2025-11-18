export const AI_CONSTANTS = {
  MAX_CONTEXT_LENGTH: 3000,
  MAX_CHAT_HISTORY: 20,
  VECTOR_SEARCH_LIMIT: 10,
  CACHE_TTL: 300, // 5 minutes
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
};

export const EMBEDDING_CONFIG = {
  modelName: "text-embedding-004",
  apiKey: process.env.GEMINI_API_KEY,
};

export const PINECONE_CONFIG = {
  enabled: process.env.USE_PINECONE === 'true' && process.env.PINECONE_API_KEY,
  indexName: process.env.PINECONE_INDEX_NAME || 'coachlix-fitness',
};