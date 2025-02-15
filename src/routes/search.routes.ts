import express from 'express';
import { cacheMiddleware } from '../middleware/cache.middleware';
import {
  searchProducts,
  getProductSuggestions
} from '../controllers/search.controller';

const router = express.Router();

router.get('/', cacheMiddleware(300), searchProducts);
router.get('/suggestions', cacheMiddleware(300), getProductSuggestions);

export default router;
