import { Request, Response, NextFunction } from 'express';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const appSecret = req.headers['x-app-secret'];

  if (!apiKey || !appSecret) {
    return res.status(401).json({ message: 'API key and App Secret are required' });
  }

  if (apiKey !== process.env.API_KEY || appSecret !== process.env.APP_SECRET) {
    return res.status(403).json({ message: 'Invalid API key or App Secret' });
  }

  next();
};
