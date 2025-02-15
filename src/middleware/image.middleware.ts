import { Request, Response, NextFunction } from 'express';
import { UploadedFile } from 'express-fileupload';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const validateImages = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files?.images) {
    return next();
  }

  const images = Array.isArray(req.files.images) 
    ? req.files.images 
    : [req.files.images];

  for (const image of images) {
    const file = image as UploadedFile;

    // Check file type
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type: ${file.name}. Allowed types: JPG, PNG, WebP`
      });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: `File too large: ${file.name}. Max size: 5MB`
      });
    }

    // Check image dimensions (optional)
    // You can add dimension validation here if needed
  }

  next();
};
