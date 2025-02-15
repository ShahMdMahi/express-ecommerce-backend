import redisClient from '../config/redis.config';
import { EcommerceEvent, EcommerceEventName, EcommerceItem } from '../types/analytics.types';
import { IOrderDocument } from '../models/order.model';
import { Document, Types } from 'mongoose';
import { RedisClientType } from 'redis';

export class AnalyticsService {
  private static readonly EVENT_EXPIRY = 60 * 60 * 24 * 30; // 30 days

  static async trackEvent(event: EcommerceEvent): Promise<void> {
    const eventKey = `analytics:ecommerce:${event.name}:${Date.now()}`;
    await redisClient.setex(eventKey, this.EVENT_EXPIRY, JSON.stringify(event));
    await this.updateEventMetrics(event);
  }

  private static async updateEventMetrics(event: EcommerceEvent): Promise<void> {
    const date = new Date();
    const dayKey = date.toISOString().split('T')[0];
    const hourKey = `${dayKey}:${date.getHours()}`;

    try {
      // Define keys as strings
      const dailyKey = `analytics:daily:${dayKey}:${event.name}`;
      const hourlyKey = `analytics:hourly:${hourKey}:${event.name}`;
      
      // Perform Redis operations with proper typing
      const pipeline = redisClient.multi();

      pipeline.incr(dailyKey as string);
      pipeline.incr(hourlyKey as string);

      // Handle revenue tracking
      if (event.name === 'purchase' && event.params.value) {
        const revenueKey = `analytics:revenue:${dayKey}`;
        pipeline.incrby(revenueKey as string, Math.floor(event.params.value * 100));
      }

      // Handle conversion tracking
      if (event.name === 'begin_checkout' || event.name === 'purchase') {
        const conversionKey = `analytics:conversions:${dayKey}:${event.name}`;
        pipeline.incr(conversionKey as string);
      }

      // Execute pipeline
      await pipeline.exec();

    } catch (error) {
      console.error('Analytics metrics update error:', error);
      throw new Error('Failed to update analytics metrics');
    }
  }

  static formatPurchaseEvent(order: IOrderDocument & Document, userId?: string): EcommerceEvent {
    if (!order._id || !Types.ObjectId.isValid(order._id.toString())) {
      throw new Error('Invalid order ID');
    }

    return {
      name: 'purchase',
      params: {
        transaction_id: order._id.toString(),
        value: order.totalAmount,
        tax: order.tax,
        shipping: order.shippingCost,
        currency: 'USD',
        payment_type: order.paymentMethod,
        items: order.items.map(item => ({
          item_id: item.product.toString(),
          item_name: item.product.toString(), // Would be populated in a real scenario
          price: item.price,
          quantity: item.quantity,
          currency: 'USD'
        }))
      },
      user_id: userId,
      timestamp: Date.now()
    };
  }

  static async getDailyMetrics(date: string): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {
      events: {},
      conversions: {
        begin_checkout: 0,
        purchase: 0
      },
      revenue: 0
    };

    const events: EcommerceEventName[] = [
      'view_item',
      'add_to_cart',
      'begin_checkout',
      'purchase'
    ];

    for (const event of events) {
      const count = await redisClient.get(`analytics:daily:${date}:${event}`) || '0';
      metrics.events[event] = parseInt(count);
    }

    // Get conversion metrics
    metrics.conversions.begin_checkout = parseInt(await redisClient.get(`analytics:conversions:${date}:begin_checkout`) || '0');
    metrics.conversions.purchase = parseInt(await redisClient.get(`analytics:conversions:${date}:purchase`) || '0');

    // Calculate revenue
    const revenue = await redisClient.get(`analytics:revenue:${date}`) || '0';
    metrics.revenue = parseInt(revenue) / 100;

    return metrics;
  }

  static async getRealtimeMetrics(): Promise<Record<string, any>> {
    const date = new Date();
    const hourKey = `${date.toISOString().split('T')[0]}:${date.getHours()}`;
    const metrics: Record<string, any> = {
      events: {},
      conversions: {
        begin_checkout: 0,
        purchase: 0
      }
    };

    const events: EcommerceEventName[] = [
      'view_item',
      'add_to_cart',
      'begin_checkout',
      'purchase'
    ];

    for (const event of events) {
      const count = await redisClient.get(`analytics:hourly:${hourKey}:${event}`) || '0';
      metrics.events[event] = parseInt(count);
    }

    return metrics;
  }
}
