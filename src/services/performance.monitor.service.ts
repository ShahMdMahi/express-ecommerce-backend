import redisClient from '../config/redis.config';
import { EventEmitter } from 'events';
import { NotificationService } from './notification.service';

interface PerformanceAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
}

export class PerformanceMonitorService {
  private static readonly ALERT_TTL = 60 * 60 * 24; // 24 hours
  private static readonly eventEmitter = new EventEmitter();

  private static readonly thresholds = {
    errorRate: 5, // 5% error rate threshold
    loadTime: 2000, // 2 seconds load time threshold
    optimizationRatio: 0.5 // 50% minimum optimization ratio
  };

  static subscribeToAlerts(callback: (alert: PerformanceAlert) => void) {
    this.eventEmitter.on('performance-alert', callback);
  }

  static async monitorMetrics() {
    setInterval(async () => {
      await this.checkErrorRates();
      await this.checkLoadTimes();
      await this.checkOptimizationRatios();
    }, 60000); // Check every minute
  }

  private static async checkErrorRates() {
    const currentErrors = await redisClient.hGetAll('image:errors:current');
    const totalRequests = await redisClient.get('image:requests:total') || '1';
    
    const errorRate = Object.values(currentErrors)
      .reduce((sum, count) => sum + parseInt(count), 0) / parseInt(totalRequests) * 100;

    if (errorRate > this.thresholds.errorRate) {
      this.createAlert({
        type: 'error',
        message: `High error rate detected: ${errorRate.toFixed(2)}%`,
        metric: 'errorRate',
        value: errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: Date.now()
      });
    }
  }

  private static async checkLoadTimes() {
    const loadTimes = await redisClient.lRange('image:loadtimes:recent', 0, -1);
    if (!loadTimes.length) return;

    const avgLoadTime = loadTimes.reduce((sum, time) => sum + parseInt(time), 0) / loadTimes.length;

    if (avgLoadTime > this.thresholds.loadTime) {
      this.createAlert({
        type: 'warning',
        message: `High average load time: ${avgLoadTime.toFixed(2)}ms`,
        metric: 'loadTime',
        value: avgLoadTime,
        threshold: this.thresholds.loadTime,
        timestamp: Date.now()
      });
    }
  }

  private static async checkOptimizationRatios() {
    const stats = await redisClient.hGetAll('image:optimization:current');
    const ratio = parseInt(stats.optimizedSize || '0') / parseInt(stats.originalSize || '1');

    if (ratio < this.thresholds.optimizationRatio) {
      this.createAlert({
        type: 'warning',
        message: `Low optimization ratio: ${(ratio * 100).toFixed(2)}%`,
        metric: 'optimizationRatio',
        value: ratio,
        threshold: this.thresholds.optimizationRatio,
        timestamp: Date.now()
      });
    }
  }

  private static async createAlert(alert: PerformanceAlert) {
    const key = `alerts:${alert.metric}:${Date.now()}`;
    await redisClient.setEx(key, this.ALERT_TTL, JSON.stringify(alert));
    this.eventEmitter.emit('performance-alert', alert);

    // Send notifications based on alert type
    if (alert.type === 'error') {
      await NotificationService.sendAlert(alert, {
        type: 'email',
        recipients: ['admin@example.com', 'tech@example.com']
      });

      // Send to webhook if configured
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (webhookUrl) {
        await NotificationService.sendAlert(alert, {
          type: 'webhook',
          webhookUrl
        });
      }
    }
  }

  static async getRecentAlerts(limit: number = 10): Promise<PerformanceAlert[]> {
    const keys = await redisClient.keys('alerts:*');
    const alerts: PerformanceAlert[] = [];

    for (const key of keys) {
      const alert = await redisClient.get(key);
      if (alert) {
        alerts.push(JSON.parse(alert));
      }
    }

    return alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}
