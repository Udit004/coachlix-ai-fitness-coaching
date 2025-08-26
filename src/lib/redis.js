
import IORedis from 'ioredis';

// Only initialize Redis on the server side
let redis = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Check if Redis is disabled via environment variable
if (process.env.DISABLE_REDIS === 'true') {
  console.log('⚠️ Redis disabled via DISABLE_REDIS environment variable');
} else if (typeof window === 'undefined') {
  // Use REDIS_URL from environment variables
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('⚠️ REDIS_URL not found - running without Redis caching');
  } else {
    try {
      // Parse Redis URL to get connection details
      const url = new URL(redisUrl);
      const dbName = process.env.REDIS_DB_NAME || 'coachlix';
      
      redis = new IORedis({
        host: url.hostname,
        port: url.port,
        password: url.password,
        db: 0, // Upstash uses database 0
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000, // Reduced timeout
        lazyConnect: true,
        // Upstash specific settings
        family: 4, // Force IPv4
        keepAlive: 30000,
        // Add database name as prefix to keys
        keyPrefix: `${dbName}:`,
        // Connection stability
        maxRetriesPerRequest: 1,
        retryDelayOnFailover: 100,
        // Disable auto-reconnect to prevent hanging
        retryDelayOnClusterDown: 100,
        maxRetriesPerRequest: 1,
        // Connection pooling
        maxRetriesPerRequest: 1,
        retryDelayOnFailover: 100,
      });

      let connectionLogged = false;
      let isConnected = false;

      redis.on('connect', () => {
        if (!connectionLogged) {
          console.log(`✅ Successfully connected to Upstash Redis (${dbName})`);
          connectionLogged = true;
          isConnected = true;
          connectionAttempts = 0; // Reset attempts on successful connection
        }
      });

      redis.on('error', (err) => {
        connectionAttempts++;
        
        if (err.code === 'ECONNRESET') {
          console.log(`⚠️ Redis connection reset (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
        } else if (err.code === 'ECONNREFUSED') {
          console.log('⚠️ Redis connection refused - running without caching');
          redis = null;
        } else {
          console.error('Redis connection error:', err);
        }

        // If too many connection attempts, disable Redis
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          console.log('⚠️ Too many Redis connection failures - disabling Redis caching');
          redis = null;
        }
      });

      redis.on('ready', () => {
        if (!connectionLogged) {
          console.log(`🎯 Redis ready for database: ${dbName}`);
        }
      });

      redis.on('close', () => {
        console.log('⚠️ Redis connection closed');
        isConnected = false;
      });

      // Try to connect with timeout
      const connectPromise = redis.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      Promise.race([connectPromise, timeoutPromise])
        .then(() => {
          console.log('✅ Redis connection established successfully');
        })
        .catch((error) => {
          console.log('⚠️ Redis connection failed - running without caching');
          console.error('Connection error:', error.message);
          redis = null;
        });

    } catch (error) {
      console.log('⚠️ Failed to create Redis client - running without caching');
      console.error('Redis setup error:', error.message);
      redis = null;
    }
  }
}

export default redis;
