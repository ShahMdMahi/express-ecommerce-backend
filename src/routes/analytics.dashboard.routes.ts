import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import {
  getImagePerformanceDashboard,
  getTopPerformingImages
} from '../controllers/analytics.dashboard.controller';

const router = express.Router();

router.use(protect, admin);

router.get('/image-performance', cacheMiddleware(300), getImagePerformanceDashboard);
router.get('/top-images', cacheMiddleware(300), getTopPerformingImages);

export default router;
