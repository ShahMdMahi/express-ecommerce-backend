import { Request, Response } from 'express';
import { Wishlist } from '../models/wishlist.model';
import { Product } from '../models/product.model';
import mongoose from 'mongoose';

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const { productId, variant } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { 
        $addToSet: { 
          items: { 
            product: productId,
            variant,
            addedAt: new Date()
          }
        }
      },
      { upsert: true, new: true }
    ).populate('items.product', 'name images price');

    res.json(wishlist);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { product: productId } } },
      { new: true }
    ).populate('items.product', 'name images price');

    res.json(wishlist);
  } catch (error) {
    res.status(400).json({ message: 'Failed to remove from wishlist' });
  }
};

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'name images price stock')
      .sort({ 'items.addedAt': -1 });

    res.json(wishlist?.items || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
};

export const clearWishlist = async (req: Request, res: Response) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to clear wishlist' });
  }
};
