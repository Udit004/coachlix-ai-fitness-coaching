// src/ai/config/cache.js
// AI Context Caching with Redis
// Optimized for 70-80% faster repeat requests

import redis from '../../lib/redis.js';

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  PROFILE: 300,        // 5 minutes - user profile changes infrequently
  DIET_PLAN: 86400,    // 24 hours - diet plans are daily
  WORKOUT_PLAN: 86400, // 24 hours - workout plans are weekly
  VECTOR_SEARCH: 1800, // 30 minutes - search results can be cached longer
  CONTEXT: 300,        // 5 minutes - combined context
};

// Cache key prefixes
const CACHE_KEYS = {
  PROFILE: 'ai:profile:',
  DIET: 'ai:diet:',
  WORKOUT: 'ai:workout:',
  VECTOR: 'ai:vector:',
  CONTEXT: 'ai:context:',
};

/**
 * Get cached data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
export async function getCached(key) {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Set data in Redis cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function setCached(key, data, ttl) {
  if (!redis) return false;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete cached data
 * @param {string} key - Cache key or pattern
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCached(key) {
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete all cached data for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function clearUserCache(userId) {
  if (!redis) return false;
  
  try {
    const keys = await redis.keys(`*:${userId}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error(`Cache clear error for user ${userId}:`, error.message);
    return false;
  }
}

// ============================================================
//                    SPECIALIZED CACHE FUNCTIONS
// ============================================================

/**
 * Get or set user profile cache
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>} Profile data
 */
export async function getCachedProfile(userId, fetchFn) {
  const key = `${CACHE_KEYS.PROFILE}${userId}`;
  
  // Try to get from cache
  const cached = await getCached(key);
  if (cached) {
    console.log(`✅ Cache HIT: Profile for ${userId}`);
    return cached;
  }
  
  // Cache miss - fetch and cache
  console.log(`⚠️ Cache MISS: Profile for ${userId}`);
  const data = await fetchFn();
  await setCached(key, data, CACHE_TTL.PROFILE);
  
  return data;
}

/**
 * Get or set diet plan cache
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>} Diet plan data
 */
export async function getCachedDietPlan(userId, fetchFn) {
  const key = `${CACHE_KEYS.DIET}${userId}`;
  
  const cached = await getCached(key);
  if (cached) {
    console.log(`✅ Cache HIT: Diet plan for ${userId}`);
    return cached;
  }
  
  console.log(`⚠️ Cache MISS: Diet plan for ${userId}`);
  const data = await fetchFn();
  await setCached(key, data, CACHE_TTL.DIET_PLAN);
  
  return data;
}

/**
 * Get or set workout plan cache
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>} Workout plan data
 */
export async function getCachedWorkoutPlan(userId, fetchFn) {
  const key = `${CACHE_KEYS.WORKOUT}${userId}`;
  
  const cached = await getCached(key);
  if (cached) {
    console.log(`✅ Cache HIT: Workout plan for ${userId}`);
    return cached;
  }
  
  console.log(`⚠️ Cache MISS: Workout plan for ${userId}`);
  const data = await fetchFn();
  await setCached(key, data, CACHE_TTL.WORKOUT_PLAN);
  
  return data;
}

/**
 * Get or set vector search cache
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>} Vector search results
 */
export async function getCachedVectorSearch(query, userId, fetchFn) {
  // Create hash of query for cache key
  const queryHash = simpleHash(query);
  const key = `${CACHE_KEYS.VECTOR}${userId}:${queryHash}`;
  
  const cached = await getCached(key);
  if (cached) {
    console.log(`✅ Cache HIT: Vector search for "${query.substring(0, 30)}..."`);
    return cached;
  }
  
  console.log(`⚠️ Cache MISS: Vector search for "${query.substring(0, 30)}..."`);
  const data = await fetchFn();
  await setCached(key, data, CACHE_TTL.VECTOR_SEARCH);
  
  return data;
}

/**
 * Get or set complete user context cache
 * @param {string} userId - User ID
 * @param {string} message - User message (for cache key)
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>} Complete context
 */
export async function getCachedContext(userId, message, fetchFn) {
  const messageHash = simpleHash(message);
  const key = `${CACHE_KEYS.CONTEXT}${userId}:${messageHash}`;
  
  const cached = await getCached(key);
  if (cached) {
    console.log(`✅ Cache HIT: Context for ${userId}`);
    return cached;
  }
  
  console.log(`⚠️ Cache MISS: Context for ${userId}`);
  const data = await fetchFn();
  await setCached(key, data, CACHE_TTL.CONTEXT);
  
  return data;
}

// ============================================================
//                    HELPER FUNCTIONS
// ============================================================

/**
 * Simple hash function for cache keys
 * @param {string} str - String to hash
 * @returns {string} Hash
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
  if (!redis) {
    return { enabled: false, message: 'Redis not available' };
  }
  
  try {
    const info = await redis.info('stats');
    const keyspace = await redis.info('keyspace');
    
    return {
      enabled: true,
      info,
      keyspace,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting cache stats:', error.message);
    return { enabled: false, error: error.message };
  }
}

export { CACHE_TTL, CACHE_KEYS };
