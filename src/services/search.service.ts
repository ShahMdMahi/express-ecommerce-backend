import { FilterQuery } from 'mongoose';
import { Product, IProduct } from '../models/product.model';
import redisClient from '../config/redis.config';

interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  ratings?: number;
  inStock?: boolean;
  attributes?: Record<string, string[]>;
}

interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export class SearchService {
  private static async getCacheKey(query: string, filters: SearchFilters, sort: SortOptions): Promise<string> {
    return `search:${JSON.stringify({ query, filters, sort })}`;
  }

  static async searchProducts(
    query: string,
    filters: SearchFilters,
    sort: SortOptions,
    page: number = 1,
    limit: number = 10
  ) {
    const cacheKey = await this.getCacheKey(query, filters, sort);
    
    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build MongoDB query
    const mongoQuery: FilterQuery<IProduct> = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    // Apply filters
    if (filters.category) {
      mongoQuery.category = filters.category;
    }
    if (filters.priceMin || filters.priceMax) {
      mongoQuery.price = {};
      if (filters.priceMin) mongoQuery.price.$gte = filters.priceMin;
      if (filters.priceMax) mongoQuery.price.$lte = filters.priceMax;
    }
    if (filters.ratings) {
      mongoQuery['reviews.rating'] = { $gte: filters.ratings };
    }
    if (filters.inStock) {
      mongoQuery['stock.quantity'] = { $gt: 0 };
    }
    if (filters.attributes) {
      Object.entries(filters.attributes).forEach(([key, values]) => {
        mongoQuery[`variants.attributes.${key}`] = { $in: values };
      });
    }

    // Execute search
    const products = await Product.find(mongoQuery)
      .sort({ [sort.field]: sort.order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name');

    const total = await Product.countDocuments(mongoQuery);
    
    const result = {
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    };

    // Cache results for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  static async getProductSuggestions(query: string, limit: number = 5) {
    const cacheKey = `suggestions:${query}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const suggestions = await Product.find({
      name: { $regex: `^${query}`, $options: 'i' },
      isActive: true
    })
    .select('name slug images price')
    .limit(limit);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(suggestions));
    
    return suggestions;
  }
}
