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
    if (expirationSeconds) {
      return await redis.setex(key, expirationSeconds, JSON.stringify(value));
    }
    return await redis.set(key, JSON.stringify(value));
  },
  
  delete: async (key) => {
    return await redis.del(key);
  },
  
  clear: async () => {
    return await redis.flushdb();
  },
};
