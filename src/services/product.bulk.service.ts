import { Product, IProduct } from '../models/product.model';
import { ImageService } from './image.service';
import { generateSlug } from '../utils/slug.util';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { ICategory } from '../models/category.model';

export class ProductBulkService {
  static async importProducts(fileBuffer: Buffer): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    const parser = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true
    });

    for await (const record of parser) {
      try {
        const productData = {
          name: record.name,
          description: record.description,
          basePrice: parseFloat(record.basePrice),
          category: record.categoryId,
          stock: {
            quantity: parseInt(record.quantity),
            lowStockThreshold: parseInt(record.lowStockThreshold),
            sku: record.sku
          },
          // Generate slug from name
          slug: await generateSlug(record.name)
        };

        await Product.create(productData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${results.success + results.failed}: ${(error as Error).message}`);
      }
    }

    return results;
  }

  static async exportProducts(): Promise<Buffer> {
    const products = await Product.find()
      .populate<{ category: ICategory }>('category', 'name');
    
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      const stringifier = stringify({
        header: true,
        columns: [
          'name',
          'description',
          'basePrice',
          'category',
          'sku',
          'quantity',
          'lowStockThreshold'
        ]
      });

      stringifier.on('readable', () => {
        let chunk;
        while ((chunk = stringifier.read()) !== null) {
          chunks.push(chunk);
        }
      });

      stringifier.on('error', reject);

      stringifier.on('finish', () => {
        resolve(Buffer.concat(chunks));
      });

      // Write products to CSV with proper type casting
      products.forEach(product => {
        const categoryName = product.category ? product.category.name : 'Uncategorized';
        stringifier.write({
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          category: categoryName,
          sku: product.stock.sku,
          quantity: product.stock.quantity,
          lowStockThreshold: product.stock.lowStockThreshold
        });
      });

      stringifier.end();
    });
  }

  static async bulkUpdatePrices(updates: Array<{ sku: string; price: number }>): Promise<void> {
    const operations = updates.map(({ sku, price }) => ({
      updateOne: {
        filter: { 'stock.sku': sku },
        update: { $set: { basePrice: price } }
      }
    }));

    await Product.bulkWrite(operations);
  }
}
