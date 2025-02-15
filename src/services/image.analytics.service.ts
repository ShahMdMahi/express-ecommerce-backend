import redisClient from '../config/redis.config';

interface ImageMetrics {
  views: number;
  downloads: number;
  errors: number;
  loadTime: number;
  size: number;
}

export class ImageAnalyticsService {
  private static readonly METRICS_TTL = 60 * 60 * 24 * 30; // 30 days

  static async trackView(imageUrl: string, loadTime: number): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `image:metrics:${date}:${imageUrl}`;

    try {
      await redisClient
        .multi()
        .hIncrBy(key, 'views', 1)
        .hIncrBy(key, 'totalLoadTime', loadTime)
        .expire(key, this.METRICS_TTL)
        .exec();
    } catch (error) {
      console.error('Error tracking image view:', error);
    }
  }

  static async trackError(imageUrl: string, errorType: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `image:errors:${date}:${imageUrl}`;

    try {
      await redisClient
        .multi()
        .hIncrBy(key, errorType, 1)
        .hIncrBy(key, 'total', 1)
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

      const data = await redisClient.hGetAll(key);
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
    const keys = await redisClient.keys(`image:errors:*`);

    for (const key of keys) {
      const data = await redisClient.hGetAll(key);
      Object.entries(data).forEach(([type, count]) => {
        if (type !== 'total') {
          errors[type] = (errors[type] || 0) + parseInt(count);
        }
      });
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
        .hIncrBy(key, 'totalOptimizations', 1)
        .hIncrBy(key, 'totalSizeReduction', metrics.originalSize - metrics.optimizedSize)
        .hIncrBy(key, `format:${metrics.format}`, 1)
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    let totalViews = 0;
    let totalLoadTime = 0;
    let totalErrors = 0;
    let bandwidthSaved = 0;

    const keys = await redisClient.keys('image:metrics:*');
    
    for (const key of keys) {
      const data = await redisClient.hGetAll(key);
      if (data.views) {
        totalViews += parseInt(data.views);
        totalLoadTime += parseInt(data.totalLoadTime || '0');
        totalErrors += parseInt(data.errors || '0');
        bandwidthSaved += parseInt(data.sizeReduction || '0');
      }
    }

    return {
      totalViews,
      avgLoadTime: totalViews ? totalLoadTime / totalViews : 0,
      errorRate: totalViews ? (totalErrors / totalViews) * 100 : 0,
      bandwidthSaved
    };
  }

  static async getImageHealthScore(imageUrl: string): Promise<number> {
    const metrics = await this.getMetrics(imageUrl, 1);
    if (!metrics.length) return 100;

    const metric = metrics[0];
    const loadTimeScore = Math.max(0, 100 - (metric.loadTime / 10));
    const errorScore = Math.max(0, 100 - (metric.errors * 20));

    return Math.round((loadTimeScore + errorScore) / 2);
  }
}
