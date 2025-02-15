import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist
} from '../controllers/wishlist.controller';

const router = express.Router();

router.use(protect); // All wishlist routes require authentication

router.route('/')
  .get(getWishlist)
  .post(addToWishlist)
  .delete(clearWishlist);

router.delete('/:productId', removeFromWishlist);

export default router;
