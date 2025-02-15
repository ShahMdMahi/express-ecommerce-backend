import { Product, IProduct } from '../models/product.model';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.types';
import { FilterQuery } from 'mongoose';
import redisClient from '../config/redis.config';

export class ProductService {
    private static CACHE_TTL = 300; // 5 minutes

    static async createProduct(productData: CreateProductDTO): Promise<IProduct> {
        const product = new Product(productData);
        await product.save();
        await this.invalidateCache();
        return product;
    }

    static async getProduct(id: string): Promise<IProduct | null> {
        const cacheKey = `product:${id}`;
        const cachedProduct = await redisClient.get(cacheKey);

        if (cachedProduct) {
            return JSON.parse(cachedProduct);
        }

        const product = await Product.findById(id);
        
        if (product) {
            await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(product));
        }

        return product;
    }

    static async updateProduct(id: string, updateData: UpdateProductDTO): Promise<IProduct | null> {
        const product = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (product) {
            await this.invalidateCache(id);
        }

        return product;
    }

    static async deleteProduct(id: string): Promise<boolean> {
        const result = await Product.findByIdAndDelete(id);
        if (result) {
            await this.invalidateCache(id);
            return true;
        }
        return false;
    }

    static async searchProducts(query: FilterQuery<IProduct>, page = 1, limit = 10) {
        const cacheKey = `products:search:${JSON.stringify(query)}:${page}:${limit}`;
        const cachedResult = await redisClient.get(cacheKey);

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product.find(query).skip(skip).limit(limit),
            Product.countDocuments(query)
        ]);

        const result = {
            products,
            total,
            page,
            pages: Math.ceil(total / limit)
        };

        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        return result;
    }

    private static async invalidateCache(id?: string) {
        if (id) {
            await redisClient.del(`product:${id}`);
        }
        // Invalidate search cache
        const keys = await redisClient.keys('products:search:*');
        if (keys.length) {
            await redisClient.del(keys);
        }
    }

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
        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

        return result;
    }

    static async getProductBySlug(slug: string) {
        const cacheKey = `product:${slug}`;
        
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const product = await Product.findOne({ slug })
            .populate('category', 'name');

        if (product) {
            await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(product));
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
