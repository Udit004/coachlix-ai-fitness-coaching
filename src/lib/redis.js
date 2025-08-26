
import IORedis from 'ioredis';

// Use REDIS_URL from environment variables with a fallback for local development
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redis;

try {
  redis = new IORedis(redisUrl, {
    // Options to handle connection errors and retries
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  });

  redis.on('connect', () => {
    console.log('Successfully connected to Redis.');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

} catch (error) {
  console.error('Failed to create Redis client:', error);
  // If Redis is critical, you might want to exit the process
  // process.exit(1);
}

export default redis;
