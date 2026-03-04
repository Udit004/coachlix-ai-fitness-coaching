import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error("UPSTASH_REDIS_REST_URL is not defined");
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("UPSTASH_REDIS_REST_TOKEN is not defined");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache helper functions
export const cache = {
  get: async (key) => {
    return await redis.get(key);
  },
  
  set: async (key, value, expirationSeconds) => {
    // Pass value directly — Upstash client auto-serializes objects to JSON.
    // Do NOT JSON.stringify here: manual stringification causes double-encoding
    // resulting in cache reads returning a string instead of the original object.
    if (expirationSeconds) {
      return await redis.setex(key, expirationSeconds, value);
    }
    return await redis.set(key, value);
  },
  
  delete: async (key) => {
    return await redis.del(key);
  },
  
  clear: async () => {
    return await redis.flushdb();
  },
};
