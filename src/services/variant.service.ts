import { Product } from '../models/product.model';
import { ImageService } from './image.service';
import redisClient from '../config/redis.config';

export class VariantService {
  static async addVariant(productId: string, variantData: any) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    // Check if SKU already exists
    const skuExists = product.variants.some(v => v.sku === variantData.sku);
    if (skuExists) throw new Error('SKU already exists');

    product.variants.push(variantData);
    await product.save();

    // Invalidate cache
    await redisClient.del(`product:${product.slug}`);

    return product;
  }

  static async updateVariant(productId: string, sku: string, updateData: any) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, 'variants.sku': sku },
      { $set: { 'variants.$': { ...updateData, sku } } },
      { new: true }
    );

    if (!product) throw new Error('Product or variant not found');

    // Invalidate cache
    await redisClient.del(`product:${product.slug}`);

    return product;
  }

  static async deleteVariant(productId: string, sku: string) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    // Delete variant images
    const variant = product.variants.find(v => v.sku === sku);
    if (variant?.images?.length) {
      await Promise.all(variant.images.map(ImageService.deleteImage));
    }

    product.variants = product.variants.filter(v => v.sku !== sku);
    await product.save();

    // Invalidate cache
    await redisClient.del(`product:${product.slug}`);

    return product;
  }

  static async bulkUpdateVariants(productId: string, updates: Array<any>) {
    const operations = updates.map(update => ({
      updateOne: {
        filter: { 
          _id: productId,
          'variants.sku': update.sku 
        },
        update: { 
          $set: { 'variants.$': update } 
        }
      }
    }));

    const result = await Product.bulkWrite(operations);
    
    // Invalidate cache
    const product = await Product.findById(productId);
    if (product) {
      await redisClient.del(`product:${product.slug}`);
    }

    return result;
  }
}
