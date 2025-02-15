import { Request, Response, NextFunction } from 'express';
import { ImageOptimizationService } from '../services/image.optimization.service';
import { UploadedFile } from 'express-fileupload';

export const optimizeUploadedImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.files) return next();

  try {
    const files = req.files;
    for (const key in files) {
      const file = Array.isArray(files[key])
        ? files[key][0]
        : files[key] as UploadedFile;

      if (file.mimetype.startsWith('image/')) {
        const optimized = await ImageOptimizationService.optimizeImage(
          file.data,
          { format: 'webp' }
        );
        file.data = optimized.buffer;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
