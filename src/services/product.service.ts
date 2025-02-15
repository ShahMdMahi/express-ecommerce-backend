import { Product, IProduct } from '../models/product.model';
import redisClient from '../config/redis.config';
import { FilterQuery } from 'mongoose';

export class ProductService {
  private static readonly CACHE_TTL = 60 * 5; // 5 minutes

  static async getProducts(filters: FilterQuery<IProduct>, page = 1, limit = 10) {
    const cacheKey = `products:${JSON.stringify(filters)}:${page}:${limit}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // DB query
    const query = Product.find(filters)
      .populate('category', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const [products, total] = await Promise.all([
      query.exec(),
      Product.countDocuments(filters)
    ]);

    const result = {
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    };

    // Cache results
    await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  static async getProductBySlug(slug: string) {
    const cacheKey = `product:${slug}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const product = await Product.findOne({ slug })
      .populate('category', 'name');

    if (product) {
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(product));
    }

    return product;
  }

  static async updateStock(productId: string, variantSku: string | null, quantity: number) {
    const update = variantSku
      ? { $inc: { 'variants.$[variant].stock': quantity } }
      : { $inc: { 'stock.quantity': quantity } };

    const options = variantSku
      ? { arrayFilters: [{ 'variant.sku': variantSku }] }
      : {};

    const product = await Product.findByIdAndUpdate(
      productId,
      update,
      { new: true, ...options }
    );

    if (product) {
      // Invalidate cache
      await redisClient.del(`product:${product.slug}`);
    }

    return product;
  }

  static async checkLowStock() {
    return Product.find({
      $or: [
        { 'stock.quantity': { $lte: { $ref: 'stock.lowStockThreshold' } } },
        { 'variants.stock': { $lte: 5 } }
      ]
    });
  }
}
