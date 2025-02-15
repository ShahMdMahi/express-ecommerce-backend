import { Request, Response } from 'express';
import { Review } from '../models/review.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import mongoose from 'mongoose';

export const createReview = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, rating, title, comment, images } = req.body;
    const userId = req.user._id;

    // Check if user has purchased the product
    const hasOrdered = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'delivered'
    });

    const review = await Review.create([{
      user: userId,
      product: productId,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase: !!hasOrdered
    }], { session });

    // Update product review statistics
    await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          'reviews.count': 1,
          [`reviews.distribution.${rating}`]: 1
        },
        $set: {
          'reviews.rating': await calculateAverageRating(productId)
        }
      },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(review[0]);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: (error as Error).message });
  } finally {
    session.endSession();
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort || '-createdAt';

    const reviews = await Review.find({ 
      product: productId,
      status: 'approved'
    })
      .populate('user', 'firstName lastName')
      .sort(sort as string)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Review.countDocuments({ 
      product: productId,
      status: 'approved'
    });

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

export const updateReviewStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, session }
    );

    if (!review) {
      throw new Error('Review not found');
    }

    // Recalculate product review statistics if status changes
    await Product.findByIdAndUpdate(
      review.product,
      {
        $set: {
          'reviews.rating': await calculateAverageRating(review.product)
        }
      },
      { session }
    );

    await session.commitTransaction();
    res.json(review);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: (error as Error).message });
  } finally {
    session.endSession();
  }
};

const calculateAverageRating = async (productId: mongoose.Types.ObjectId) => {
  const result = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { 
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' }
      }
    }
  ]);
  return result[0]?.averageRating || 0;
};
