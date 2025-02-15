import { Request, Response } from 'express';
import { ImageAnalyticsService } from '../services/image.analytics.service';
import redisClient from '../config/redis.config';

export const getImagePerformanceDashboard = async (req: Request, res: Response) => {
  try {
    const { timeframe = '7' } = req.query;
    const days = parseInt(timeframe as string);

    const [optimizationStats, errorReport] = await Promise.all([
      ImageAnalyticsService.getOptimizationStats(days),
      ImageAnalyticsService.getErrorReport(
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      )
    ]);

    const totalSizeReduction = optimizationStats.totalSizeReduction / (1024 * 1024); // Convert to MB

    res.json({
      optimizationStats: {
        ...optimizationStats,
        totalSizeReduction: `${totalSizeReduction.toFixed(2)}MB`,
        averageCompressionRatio: (
          optimizationStats.totalSizeReduction / optimizationStats.totalOptimizations
        ).toFixed(2)
      },
      errorReport,
      timeframe: days
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

export const getTopPerformingImages = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const pattern = 'image:metrics:*';
    const keys = await redisClient.keys(pattern);
    const performanceData = [];

    for (const key of keys) {
      const data = await redisClient.hGetAll(key);
      if (data.views) {
        performanceData.push({
          path: key.split(':')[2],
          views: parseInt(data.views),
          avgLoadTime: parseInt(data.totalLoadTime) / parseInt(data.views),
          errors: parseInt(data.errors || '0')
        });
      }
    }

    const sortedData = performanceData
      .sort((a, b) => b.views - a.views)
      .slice(0, parseInt(limit as string));

    res.json(sortedData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top performing images' });
  }
};
