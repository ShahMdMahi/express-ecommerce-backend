import redisClient from '../config/redis.config';
import { redisCommands } from '../utils/redis.util';

interface RateLimitConfig {
  key: string;
  limit: number;
  window: number; // in seconds
}

export class RateLimiterService {
  private static readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS = 100;

  static async checkRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE_MS;

    await RateLimiterService.cleanup(key, windowStart);
    const requestCount = await RateLimiterService.getRequestCount(key);

    if (requestCount >= this.MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + this.WINDOW_SIZE_MS
      };
    }

    // Record new request
    await redisCommands.setex(redisClient, `${key}:${now}`, this.WINDOW_SIZE_MS / 1000, '1');

    return {
      allowed: true,
      remaining: this.MAX_REQUESTS - requestCount - 1,
      resetTime: windowStart + this.WINDOW_SIZE_MS
    };
  }

  private static async cleanup(key: string, windowStart: number): Promise<void> {
    const keys = await redisClient.keys(`${key}:*`);
    for (const k of keys) {
      const timestamp = parseInt(k.split(':').pop() || '0');
      if (timestamp < windowStart) {
        await redisClient.del(k);
      }
    }
  }

  private static async getRequestCount(key: string): Promise<number> {
    const keys = await redisClient.keys(`${key}:*`);
    return keys.length;
  }

  static async isAllowed(config: RateLimitConfig): Promise<boolean> {
    const { key, limit, window } = config;
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (window * 1000))}`;

    const multi = redisClient.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, window);

    const [count] = await multi.exec() as [number, any];
    return count <= limit;
  }

  static async getNotificationLimiter(type: string): Promise<boolean> {
    const configs = {
      email: { limit: 10, window: 3600 }, // 10 emails per hour
      webhook: { limit: 60, window: 3600 }, // 60 webhooks per hour
      slack: { limit: 30, window: 3600 } // 30 slack messages per hour
    };

    const config = configs[type as keyof typeof configs];
    if (!config) return true;

    return this.isAllowed({
      key: `notification:${type}`,
      ...config
    });
  }

  static async trackNotification(type: string): Promise<void> {
    const key = `notification:${type}:${Date.now()}`;
    await redisCommands.setex(redisClient, key, 86400, '1');
  }
}
