import { Request, Response } from 'express';
import { PerformanceMonitorService } from '../services/performance.monitor.service';

export const getPerformanceAlerts = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const alerts = await PerformanceMonitorService.getRecentAlerts(parseInt(limit as string));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch performance alerts' });
  }
};

export const subscribeToAlerts = (req: Request, res: Response) => {
  // Set up SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendAlert = (alert: any) => {
    res.write(`data: ${JSON.stringify(alert)}\n\n`);
  };

  PerformanceMonitorService.subscribeToAlerts(sendAlert);

  // Handle client disconnect
  req.on('close', () => {
    // Clean up subscription
    res.end();
  });
};
