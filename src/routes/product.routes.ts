import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  updateStock
} from '../controllers/product.controller';
import { 
  addVariant, 
  updateVariant, 
  deleteVariant 
} from '../controllers/product.variant.controller';
import { 
  importProducts, 
  exportProducts, 
  bulkUpdatePrices 
} from '../controllers/product.bulk.controller';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(300), getProducts);
router.get('/:slug', cacheMiddleware(300), getProductBySlug);

// Protected admin routes
router.use(protect, admin);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateStock);

// Variant management routes
router.post('/:productId/variants', protect, admin, addVariant);
router.put('/:productId/variants/:sku', protect, admin, updateVariant);
router.delete('/:productId/variants/:sku', protect, admin, deleteVariant);

// Bulk operation routes
router.post('/bulk/import', protect, admin, importProducts);
router.get('/bulk/export', protect, admin, exportProducts);
router.post('/bulk/prices', protect, admin, bulkUpdatePrices);

export default router;
