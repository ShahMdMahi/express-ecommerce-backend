import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { EcommerceEvent } from '../types/analytics.types';

export const trackPageView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event: EcommerceEvent = {
      name: 'page_view',
      params: {
        currency: 'USD',
        page_path: req.path,
        page_title: req.path.split('/').pop() || 'home'
      },
      user_id: req.user?._id?.toString(),
      client_id: req.headers['x-client-id'] as string,
      timestamp: Date.now()
    };
    
    await AnalyticsService.trackEvent(event);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
  
  next();
};
