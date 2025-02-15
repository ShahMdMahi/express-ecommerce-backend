import { Request, Response, NextFunction } from 'express';
import fileUpload from 'express-fileupload';

export const uploadMiddleware = fileUpload({
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: process.env.NODE_ENV === 'development'
});

export const validateImages = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files?.images) {
    return next();
  }

  const files = Array.isArray(req.files.images) 
    ? req.files.images 
    : [req.files.images];

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const invalid = files.some(file => !allowedTypes.includes(file.mimetype));

  if (invalid) {
    return res.status(400).json({ 
      message: 'Invalid file type. Only JPEG, PNG and WebP images are allowed.' 
    });
  }

  next();
};
