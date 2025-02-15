import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { FileArray, UploadedFile } from 'express-fileupload';
import path from 'path';
import crypto from 'crypto';
import { CDNService } from './cdn.service';

interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

interface ImageOptions {
  sizes?: ImageSize[];
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  generateThumbnail?: boolean;
}

export class ImageService {
  private static readonly defaultSizes: ImageSize[] = [
    { width: 800, height: 800, suffix: 'large' },
    { width: 400, height: 400, suffix: 'medium' },
    { width: 200, height: 200, suffix: 'small' }
  ];

  private static readonly defaultOptions: ImageOptions = {
    sizes: ImageService.defaultSizes,
    quality: 80,
    format: 'webp',
    generateThumbnail: true
  };

  static async uploadMultiple(files: FileArray, folder: string, options: ImageOptions = {}): Promise<string[]> {
    const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
    const uploadPromises = imageFiles.map(file => this.processAndUpload(file, folder, options));
    return Promise.all(uploadPromises);
  }

  static async uploadSingle(file: UploadedFile, folder: string, options: ImageOptions = {}): Promise<string> {
    try {
      return await this.processAndUpload(file, folder, options);
    } catch (error) {
      console.error('Error uploading single image:', error);
      throw new Error('Failed to upload image');
    }
  }

  private static async processAndUpload(file: UploadedFile, folder: string, options: ImageOptions): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const fileName = this.generateFileName(file.name);
    const buffer = await this.optimizeImage(file.data, opts);

    const urls: string[] = [];
    
    // Upload main image
    const mainUrl = await this.uploadToBlob(buffer, `${folder}/${fileName}`, file.mimetype);
    urls.push(mainUrl);

    // Generate and upload different sizes
    if (opts.sizes) {
      const sizePromises = opts.sizes.map(async size => {
        const resizedBuffer = await this.resizeImage(file.data, size);
        const sizeFileName = `${fileName}-${size.suffix}`;
        return this.uploadToBlob(resizedBuffer, `${folder}/${sizeFileName}`, file.mimetype);
      });

      const sizeUrls = await Promise.all(sizePromises);
      urls.push(...sizeUrls);
    }

    // Generate thumbnail if needed
    if (opts.generateThumbnail) {
      const thumbnailBuffer = await this.createThumbnail(file.data);
      const thumbnailUrl = await this.uploadToBlob(
        thumbnailBuffer,
        `${folder}/thumbnails/${fileName}`,
        file.mimetype
      );
      urls.push(thumbnailUrl);
    }

    return urls[0]; // Return main image URL
  }

  private static async optimizeImage(buffer: Buffer, options: ImageOptions): Promise<Buffer> {
    const image = sharp(buffer);
    
    if (options.format) {
      image.toFormat(options.format, { quality: options.quality });
    }

    return image
      .metadata()
      .then(metadata => {
        if (metadata.width && metadata.width > 1920) {
          return image.resize(1920, null, { withoutEnlargement: true });
        }
        return image;
      })
      .then(img => img.toBuffer());
  }

  private static async resizeImage(buffer: Buffer, size: ImageSize): Promise<Buffer> {
    return sharp(buffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();
  }

  private static async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(100, 100, {
        fit: 'cover',
        position: 'centre'
      })
      .toBuffer();
  }

  private static async uploadToBlob(buffer: Buffer, path: string, mimeType: string): Promise<string> {
    // Try to get cached URL first
    const cachedUrl = await CDNService.getCachedUrl(path);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Upload to CDN with supported options only
    return CDNService.uploadToCDN(buffer, path, {
      contentType: mimeType,
      isPrivate: false
    });
  }

  private static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5')
      .update(originalName + timestamp)
      .digest('hex')
      .slice(0, 8);
    const ext = path.extname(originalName);
    return `${hash}-${timestamp}${ext}`;
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      await del(url);
      // Extract path from URL and invalidate cache
      const path = new URL(url).pathname;
      await CDNService.invalidateCache(path);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
}
