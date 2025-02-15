import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { getPerformanceAlerts, subscribeToAlerts } from '../controllers/performance.monitor.controller';

const router = express.Router();

router.use(protect, admin);

router.get('/alerts', getPerformanceAlerts);
router.get('/alerts/stream', subscribeToAlerts);

export default router;
