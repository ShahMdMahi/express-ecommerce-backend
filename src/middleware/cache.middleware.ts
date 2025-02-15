import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis.config';

export const cacheMiddleware = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      const originalJson = res.json;
      res.json = function (data) {
        redisClient.setex(key, duration, JSON.stringify(data));
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

export const imageCacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/images/')) {
    return next();
  }

  const cacheKey = `image:${req.path}`;
  
  try {
    const cachedImage = await redisClient.get(cacheKey);
    if (cachedImage) {
      const { contentType, buffer } = JSON.parse(cachedImage);
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Cache', 'HIT');
      return res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('Image cache error:', error);
  }

  res.setHeader('X-Cache', 'MISS');
  next();
};

export const clearCache = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};
