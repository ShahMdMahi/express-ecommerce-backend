import redisClient from '../config/redis.config';

interface RateLimitConfig {
  key: string;
  limit: number;
  window: number; // in seconds
}

export class RateLimiterService {
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
    await redisClient.setEx(key, 86400, '1'); // Store for 24 hours
  }
}
