import { Request, Response, NextFunction } from 'express';
import { ImageAnalyticsService } from '../services/image.analytics.service';

export const trackImagePerformance = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Track response with proper type handling
    const originalEnd = res.end;
    res.end = function(
      this: Response,
      chunk?: any,
      encoding?: string | (() => void),
      cb?: (() => void)
    ): Response {
      const duration = Date.now() - startTime;
      
      if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        ImageAnalyticsService.trackView(req.path, duration)
          .catch(error => console.error('Image tracking error:', error));

        if (res.statusCode >= 400) {
          ImageAnalyticsService.trackError(req.path, `HTTP_${res.statusCode}`)
            .catch(error => console.error('Error tracking error:', error));
        }
      }

      // Handle the encoding parameter correctly
      if (typeof encoding === 'function') {
        cb = encoding;
        encoding = undefined;
      }

      return originalEnd.call(this, chunk, encoding as BufferEncoding, cb);
    };

    next();
  };
};
