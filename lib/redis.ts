import { Redis } from '@upstash/redis';

// Initialize Redis client with Upstash (server-side only)
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    // Only initialize on server-side
    if (typeof window === 'undefined') {
      const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
      
      if (!url || !token) {
        throw new Error('Redis configuration missing: KV_REST_API_URL and KV_REST_API_TOKEN are required');
      }
      
      redis = new Redis({
        url,
        token,
      });
    } else {
      throw new Error('Redis client can only be used on server-side');
    }
  }
  
  return redis;
}

// Export the Redis instance
export const redis = getRedisClient();

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      return false; // Cannot test on client-side
    }
    
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}