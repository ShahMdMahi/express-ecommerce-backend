import redisClient from '../config/redis.config';
import { redisCommands } from '../utils/redis.util';

interface NotificationMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  bounced: number;
}

export class NotificationAnalyticsService {
  private static readonly METRICS_TTL = 60 * 60 * 24 * 30; // 30 days

  static async trackEvent(
    type: string,
    status: keyof NotificationMetrics,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const hourKey = `${date}:${new Date().getHours()}`;

    const pipeline = redisClient.multi();
    
    // Daily counter
    await redisCommands.hincrby(pipeline, `notifications:daily:${date}`, status, 1);
    // Hourly counter
    await redisCommands.hincrby(pipeline, `notifications:hourly:${hourKey}`, status, 1);
    // Type-specific counter
    await redisCommands.hincrby(pipeline, `notifications:type:${type}:${date}`, status, 1);

    // Store metadata if provided
    if (Object.keys(metadata).length > 0) {
      const metadataKey = `notifications:metadata:${Date.now()}`;
      await redisCommands.setex(
        redisClient,
        metadataKey,
        this.METRICS_TTL,
        JSON.stringify({
          type,
          status,
          timestamp: Date.now(),
          ...metadata
        })
      );
    }

    await pipeline.exec();
  }

  static async getMetrics(
    timeframe: { start: Date; end: Date },
    type?: string
  ): Promise<Record<string, NotificationMetrics>> {
    const metrics: Record<string, NotificationMetrics> = {};
    const current = new Date(timeframe.start);

    while (current <= timeframe.end) {
      const date = current.toISOString().split('T')[0];
      const key = type 
        ? `notifications:type:${type}:${date}`
        : `notifications:daily:${date}`;

      const data = await redisCommands.hgetall(redisClient, key);
      
      metrics[date] = {
        sent: parseInt(data?.sent || '0'),
        delivered: parseInt(data?.delivered || '0'),
        opened: parseInt(data?.opened || '0'),
        clicked: parseInt(data?.clicked || '0'),
        failed: parseInt(data?.failed || '0'),
        bounced: parseInt(data?.bounced || '0')
      };

      current.setDate(current.getDate() + 1);
    }

    return metrics;
  }

  static async getDeliveryRate(date: string): Promise<number> {
    const metrics = await redisCommands.hgetall(redisClient, `notifications:daily:${date}`);
    const sent = parseInt(metrics?.sent || '0');
    const delivered = parseInt(metrics?.delivered || '0');
    
    return sent ? (delivered / sent) * 100 : 0;
  }

  static async getEngagementMetrics(date: string): Promise<{
    openRate: number;
    clickRate: number;
  }> {
    const metrics = await redisCommands.hgetall(redisClient, `notifications:daily:${date}`);
    const delivered = parseInt(metrics?.delivered || '0');
    const opened = parseInt(metrics?.opened || '0');
    const clicked = parseInt(metrics?.clicked || '0');

    return {
      openRate: delivered ? (opened / delivered) * 100 : 0,
      clickRate: opened ? (clicked / opened) * 100 : 0
    };
  }

  static async getStats(): Promise<Record<string, number>> {
    const data = await redisCommands.hgetall(redisClient, 'notifications:total');
    return Object.entries(data || {}).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: parseInt(value, 10)
    }), {});
  }
}
