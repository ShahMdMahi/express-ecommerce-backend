import { Request, Response } from 'express';
import { Product, IProductDocument } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { AnalyticsService } from '../services/analytics.service';
import mongoose from 'mongoose';

export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1',
      limit = '10',
      category,
      minPrice,
      maxPrice,
      tags,
      inStock,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filters: any = {};

    if (category) filters.category = category;
    if (minPrice || maxPrice) {
      filters.basePrice = {};
      if (minPrice) filters.basePrice.$gte = Number(minPrice);
      if (maxPrice) filters.basePrice.$lte = Number(maxPrice);
    }
    if (tags) filters.tags = { $in: (tags as string).split(',') };
    if (inStock === 'true') filters['stock.quantity'] = { $gt: 0 };

    const result = await ProductService.getProducts(
      filters,
      Number(page),
      Number(limit)
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await ProductService.getProductBySlug(req.params.slug);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Track product view with required quantity property
    await AnalyticsService.trackEvent({
      name: 'view_item',
      params: {
        currency: 'USD',
        value: product.basePrice,
        items: [{
          item_id: product._id.toString(),
          item_name: product.name,
          price: product.basePrice,
          currency: 'USD',
          quantity: 1  // Adding required quantity property for view event
        }]
      },
      user_id: req.user?._id?.toString(),
      client_id: req.headers['x-client-id'] as string,
      timestamp: Date.now()
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { quantity, variantSku } = req.body;
    
    const product = await ProductService.updateStock(
      req.params.id,
      variantSku,
      quantity
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
