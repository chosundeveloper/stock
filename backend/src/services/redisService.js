import { createClient } from 'redis';

let redisClient = null;

export async function setupRedis() {
  redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  await redisClient.connect();
  console.log('Redis connected');
  return redisClient;
}

export function getRedisClient() {
  return redisClient;
}

export async function cacheStock(symbol, data, ttl = 60) {
  if (!redisClient) return;
  try {
    await redisClient.setEx(
      `stock:${symbol}`,
      ttl,
      JSON.stringify(data)
    );
  } catch (err) {
    console.error('Cache error:', err);
  }
}

export async function getStockCache(symbol) {
  if (!redisClient) return null;
  try {
    const cached = await redisClient.get(`stock:${symbol}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Cache retrieval error:', err);
    return null;
  }
}

export async function deleteStockCache(symbol) {
  if (!redisClient) return;
  try {
    await redisClient.del(`stock:${symbol}`);
  } catch (err) {
    console.error('Cache deletion error:', err);
  }
}
