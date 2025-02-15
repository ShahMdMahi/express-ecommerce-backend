import mongoose, { Document } from 'mongoose';

export interface IWishlistItem {
  product: mongoose.Types.ObjectId;
  addedAt: Date;
  variant?: string;
}

export interface IWishlist {
  user: mongoose.Types.ObjectId;
  items: IWishlistItem[];
}

export interface IWishlistDocument extends IWishlist, Document {
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: String,
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Ensure unique products per user
wishlistSchema.index({ user: 1, 'items.product': 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlistDocument>('Wishlist', wishlistSchema);
