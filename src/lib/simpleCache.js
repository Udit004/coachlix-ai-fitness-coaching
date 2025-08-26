// Simple in-memory cache service
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 900; // 15 minutes in seconds
  }

  // Set a value in cache
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, {
      value,
      expiry
    });
    
    // Clean up expired entries
    this.cleanup();
    
    console.log(`✅ Cached: ${key} (TTL: ${ttl}s)`);
  }

  // Get a value from cache
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      console.log(`❌ Cache miss: ${key}`);
      return null;
    }

    if (Date.now() > item.expiry) {
      console.log(`⏰ Cache expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return item.value;
  }

  // Delete a value from cache
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
const cache = new SimpleCache();

export default cache;
