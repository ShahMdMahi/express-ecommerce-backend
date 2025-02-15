import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { getDailyStats, getRealtimeStats } from '../controllers/analytics.controller';
import { ImageAnalyticsService } from '../services/image.analytics.service';

const router = express.Router();

router.use(protect, admin); // Restrict analytics to admin users

router.get('/daily', cacheMiddleware(300), getDailyStats);
router.get('/realtime', getRealtimeStats);

// Image analytics routes
router.get('/images/:imageUrl/metrics', protect, admin, async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const metrics = await ImageAnalyticsService.getMetrics(
      req.params.imageUrl,
      parseInt(days as string)
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch image metrics' });
  }
});

router.get('/images/errors', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const errors = await ImageAnalyticsService.getErrorReport(
      startDate as string,
      endDate as string
    );
    res.json(errors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch error report' });
  }
});

export default router;
