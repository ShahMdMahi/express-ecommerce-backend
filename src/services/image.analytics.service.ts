import redisClient from '../config/redis.config';
import { redisCommands } from '../utils/redis.util';
import { Redis } from 'ioredis';

interface ImageMetrics {
  views: number;
  downloads: number;
  errors: number;
  loadTime: number;
  size: number;
}

export class ImageAnalyticsService {
  private static readonly METRICS_TTL = 60 * 60 * 24 * 30; // 30 days

  constructor(private readonly redis: Redis) {}

  async incrementMetric(key: string, field: string, value: number = 1): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.hincrby(key, field, value);
    await pipeline.exec();
  }

  async getMetrics(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async trackImageView(imageId: string): Promise<void> {
    await this.incrementMetric(`image:${imageId}:stats`, 'views');
  }

  static async trackView(imageUrl: string, loadTime: number): Promise<void> {
    const key = `image:metrics:${imageUrl}`;
    const pipeline = redisClient.multi();
    await redisCommands.hincrby(pipeline, key, 'views', 1);
    await redisCommands.hincrby(pipeline, key, 'totalLoadTime', loadTime);
    await pipeline.expire(key, this.METRICS_TTL);
    await pipeline.exec();
  }

  static async trackError(imageUrl: string, errorType: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `image:errors:${date}:${imageUrl}`;

    try {
      await redisClient
        .multi()
        .hincrby(key, errorType, 1)
        .hincrby(key, 'total', 1)
        .expire(key, this.METRICS_TTL)
        .exec();
    } catch (error) {
      console.error('Error tracking image error:', error);
    }
  }

  static async getMetrics(imageUrl: string, days: number = 7): Promise<ImageMetrics[]> {
    const metrics: ImageMetrics[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `image:metrics:${dateStr}:${imageUrl}`;

      const data = await redisClient.hgetall(key);
      if (data) {
        metrics.push({
          views: parseInt(data.views || '0'),
          downloads: parseInt(data.downloads || '0'),
          errors: parseInt(data.errors || '0'),
          loadTime: parseInt(data.totalLoadTime || '0') / (parseInt(data.views || '1')),
          size: parseInt(data.size || '0')
        });
      }
    }

    return metrics;
  }

  static async getErrorReport(startDate: string, endDate: string): Promise<Record<string, number>> {
    const errors: Record<string, number> = {};
    const keys = await redisClient.keys('image:errors:*');

    for (const key of keys) {
      const data = await redisCommands.hgetall(redisClient, key);
      if (data) {
        Object.entries(data).forEach(([type, count]) => {
          if (type !== 'total') {
            errors[type] = (errors[type] || 0) + parseInt(count);
          }
        });
      }
    }

    return errors;
  }

  static async trackOptimization(metrics: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
    dimensions: string;
  }): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `image:optimization:${date}`;

    try {
      await redisClient
        .multi()
        .hincrby(key, 'totalOptimizations', 1)
        .hincrby(key, 'totalSizeReduction', metrics.originalSize - metrics.optimizedSize)
        .hincrby(key, `format:${metrics.format}`, 1)
        .expire(key, this.METRICS_TTL)
        .exec();
    } catch (error) {
      console.error('Error tracking optimization:', error);
    }
  }

  static async getOptimizationStats(days: number = 7): Promise<any> {
    const stats = {
      totalOptimizations: 0,
      totalSizeReduction: 0,
      formatDistribution: {} as Record<string, number>
    };

    // ... implement stats aggregation logic ...

    return stats;
  }

  static async getPerformanceMetrics(timeframe: number): Promise<{
    totalViews: number;
    avgLoadTime: number;
    errorRate: number;
    bandwidthSaved: number;
  }> {
    const keys = await redisClient.keys('image:metrics:*');
    const metrics = await Promise.all(
      keys.map(key => redisClient.hgetall(key))
    );

    return metrics.reduce((acc, data) => ({
      totalViews: acc.totalViews + parseInt(data.views || '0'),
      avgLoadTime: acc.avgLoadTime + parseInt(data.totalLoadTime || '0'),
      errorRate: acc.errorRate + parseInt(data.errors || '0'),
      bandwidthSaved: acc.bandwidthSaved + parseInt(data.sizeReduction || '0')
    }), {
      totalViews: 0,
      avgLoadTime: 0,
      errorRate: 0,
      bandwidthSaved: 0
    });
  }

  static async getImageHealthScore(imageUrl: string): Promise<number> {
    const metrics = await this.getMetrics(imageUrl, 1);
    if (!metrics.length) return 100;

    const metric = metrics[0];
    const loadTimeScore = Math.max(0, 100 - (metric.loadTime / 10));
    const errorScore = Math.max(0, 100 - (metric.errors * 20));

    return Math.round((loadTimeScore + errorScore) / 2);
  }

  static async trackMetric(path: string, metric: string, value: number) {
    const pipeline = redisClient.multi();
    await redisCommands.hincrby(pipeline, `image:metrics:${path}`, metric, value);
    await pipeline.exec();
  }
}
