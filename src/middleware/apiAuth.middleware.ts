import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config/app.config';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header(appConfig.apiKeys.headerKey);
    const appSecret = req.header(appConfig.apiKeys.headerSecret);

    if (!apiKey || !appSecret) {
        return res.status(401).json({
            success: false,
            message: 'API key and secret are required'
        });
    }

    try {
        // Here you would validate against your stored API keys
        // For now, we'll use environment variables
        if (apiKey !== process.env.API_KEY || appSecret !== process.env.APP_SECRET) {
            throw new Error('Invalid API credentials');
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API credentials'
        });
    }
};
