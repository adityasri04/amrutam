import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis disconnected successfully');
    } catch (error) {
      console.error('❌ Redis disconnection failed:', error);
      throw error;
    }
  }
}

// Cache functions
export async function setCache(key: string, value: any, ttl: number = 3600) {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set cache error:', error);
  }
}

export async function getCache(key: string) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get cache error:', error);
    return null;
  }
}

export async function deleteCache(key: string) {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Redis delete cache error:', error);
  }
}

export async function clearCache(pattern: string = '*') {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Redis clear cache error:', error);
  }
}
