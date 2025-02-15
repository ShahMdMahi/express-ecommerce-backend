import sharp from 'sharp';
import { ImageAnalyticsService } from './image.analytics.service';

interface OptimizationResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  compressionRatio: number;
}

export class ImageOptimizationService {
  private static readonly QUALITY_THRESHOLD = 85;
  private static readonly MAX_WIDTH = 1920;
  private static readonly MAX_SIZE_MB = 0.5; // 500KB target

  static async optimizeImage(
    buffer: Buffer,
    options: {
      format?: 'jpeg' | 'webp' | 'avif';
      quality?: number;
      maxWidth?: number;
    } = {}
  ): Promise<OptimizationResult> {
    const originalSize = buffer.length;
    let optimizedBuffer: Buffer;
    let metadata: sharp.Metadata;
    let quality = options.quality || this.QUALITY_THRESHOLD;
    
    try {
      const image = sharp(buffer);
      metadata = await image.metadata();

      // Auto-select best format if not specified
      const format = options.format || this.selectOptimalFormat(metadata.format);
      
      // Resize if needed
      const maxWidth = options.maxWidth || this.MAX_WIDTH;
      if (metadata.width && metadata.width > maxWidth) {
        image.resize(maxWidth, null, { withoutEnlargement: true });
      }

      // Optimize based on format
      optimizedBuffer = await this.optimizeByFormat(image, format, quality);
      
      const result = {
        buffer: optimizedBuffer,
        format,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: optimizedBuffer.length,
        compressionRatio: originalSize / optimizedBuffer.length
      };

      // Track optimization metrics
      await this.trackOptimizationMetrics(result);

      return result;
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error('Failed to optimize image');
    }
  }

  private static async optimizeByFormat(
    image: sharp.Sharp,
    format: string,
    quality: number
  ): Promise<Buffer> {
    switch (format) {
      case 'webp':
        return image
          .webp({ quality, effort: 6 })
          .toBuffer();
      case 'avif':
        return image
          .avif({ quality, effort: 9 })
          .toBuffer();
      case 'jpeg':
        return image
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      default:
        return image.toBuffer();
    }
  }

  private static selectOptimalFormat(currentFormat?: string): 'webp' | 'avif' | 'jpeg' {
    // Prefer WebP for general use, AVIF for high quality, JPEG for compatibility
    return 'webp';
  }

  private static async trackOptimizationMetrics(result: OptimizationResult): Promise<void> {
    const metrics = {
      originalSize: result.size * result.compressionRatio,
      optimizedSize: result.size,
      compressionRatio: result.compressionRatio,
      format: result.format,
      dimensions: `${result.width}x${result.height}`
    };

    await ImageAnalyticsService.trackOptimization(metrics);
  }

  static async generateResponsiveSizes(
    buffer: Buffer,
    breakpoints: number[] = [640, 768, 1024, 1280]
  ): Promise<Map<number, Buffer>> {
    const sizes = new Map<number, Buffer>();

    for (const width of breakpoints) {
      const { buffer: resizedBuffer } = await this.optimizeImage(buffer, {
        maxWidth: width,
        format: 'webp'
      });
      sizes.set(width, resizedBuffer);
    }

    return sizes;
  }
}
