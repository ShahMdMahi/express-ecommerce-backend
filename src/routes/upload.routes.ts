import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { validateImages } from '../middleware/image.middleware';
import { uploadImages, uploadSingleFile } from '../controllers/upload.controller';

const router = express.Router();

// Apply protection and validation middleware
router.use(protect, validateImages);

// Upload routes
router.post('/multiple', uploadImages);
router.post('/single', uploadSingleFile);

export default router;
