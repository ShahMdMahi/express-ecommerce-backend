import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import {
  createReview,
  getProductReviews,
  updateReviewStatus
} from '../controllers/review.controller';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/product/:productId', cacheMiddleware(300), getProductReviews);
router.put('/:id/status', protect, admin, updateReviewStatus);

export default router;
