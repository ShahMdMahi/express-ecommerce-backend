import mongoose, { Document } from 'mongoose';

export interface IReview {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface IReviewDocument extends IReview, Document {
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  images: [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

// Compound index to prevent multiple reviews from same user for same product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);
