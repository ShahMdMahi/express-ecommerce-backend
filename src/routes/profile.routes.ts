import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress
} from '../controllers/profile.controller';

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.put('/avatar', protect, uploadMiddleware, updateAvatar);

// Address routes
router.post('/addresses', protect, addAddress);
router.get('/addresses', protect, getAddresses);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

export default router;
