import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import {
  createCategory,
  getCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller';

const router = express.Router();

router.route('/')
  .get(cacheMiddleware(300), getCategories)
  .post(protect, admin, createCategory);

router.route('/:id')
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

router.get('/:slug', cacheMiddleware(300), getCategoryBySlug);

export default router;
