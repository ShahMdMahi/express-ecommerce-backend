import { put } from '@vercel/blob';
import redisClient from '../config/redis.config';
import { redisCommands } from '../utils/redis.util';

interface CDNOptions {
  contentType?: string;
  isPrivate?: boolean;
}

export class CDNService {
  private static readonly CACHE_TTL = 60 * 60 * 24; // 24 hours

  static async uploadToCDN(
    buffer: Buffer,
    path: string,
    options: CDNOptions = {}
  ): Promise<string> {
    const {
      contentType = 'image/webp',
      isPrivate = false
    } = options;

    // Upload to Vercel Blob with their supported options
    const { url } = await put(path, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false // Ensure consistent URLs
    });

    // Cache the CDN URL only for public resources
    if (!isPrivate) {
      await this.cacheUrl(path, url);
    }

    return url;
  }

  static async getCachedUrl(path: string): Promise<string | null> {
    return redisClient.get(`cdn:url:${path}`);
  }

  private static async cacheUrl(path: string, url: string): Promise<void> {
    await redisClient.setex(`cdn:url:${path}`, this.CACHE_TTL, url);
  }

  static async invalidateCache(path: string): Promise<void> {
    await redisClient.del(`cdn:url:${path}`);
  }

  static async cacheResponse(key: string, data: any, ttl: number): Promise<void> {
    await redisCommands.setex(redisClient, key, ttl, JSON.stringify(data));
  }
}
