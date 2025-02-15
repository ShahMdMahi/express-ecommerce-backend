import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { cacheMiddleware } from '../middleware/cache.middleware';

export const getDailyStats = async (req: Request, res: Response) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const stats = await AnalyticsService.getDailyMetrics(date as string);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

export const getRealtimeStats = async (req: Request, res: Response) => {
  try {
    const stats = await AnalyticsService.getRealtimeMetrics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch realtime stats' });
  }
};
