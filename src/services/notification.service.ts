import nodemailer from 'nodemailer';
import { EmailService } from './email.service';
import { NotificationTemplateService } from './notification.template.service';
import { RateLimiterService } from './rate.limiter.service';

interface NotificationOptions {
  type: 'email' | 'webhook' | 'slack';
  recipients?: string[];
  webhookUrl?: string;
  slackChannel?: string;
}

export class NotificationService {
  private static readonly emailTemplate = {
    performance: {
      subject: 'Performance Alert: {type}',
      body: `
        Performance Issue Detected
        Type: {type}
        Message: {message}
        Value: {value}
        Threshold: {threshold}
        Time: {timestamp}
      `
    }
  };

  static async sendAlert(
    alert: any,
    options: NotificationOptions
  ): Promise<void> {
    try {
      switch (options.type) {
        case 'email':
          await this.sendEmailAlert(alert, options.recipients || []);
          break;
        case 'webhook':
          if (options.webhookUrl) {
            await this.sendWebhookAlert(alert, options.webhookUrl);
          }
          break;
        case 'slack':
          if (options.slackChannel) {
            await this.sendSlackAlert(alert, options.slackChannel);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  private static async sendEmailAlert(
    alert: any,
    recipients: string[]
  ): Promise<void> {
    if (!(await RateLimiterService.getNotificationLimiter('email'))) {
      console.warn('Email rate limit exceeded');
      return;
    }

    const html = NotificationTemplateService.renderTemplate('performance-alert', {
      ...alert,
      title: `Performance Alert: ${alert.type}`,
      recommendations: this.getRecommendations(alert)
    });

    await EmailService.sendMail({
      to: recipients,
      subject: `Performance Alert: ${alert.type}`,
      html
    });

    await RateLimiterService.trackNotification('email');
  }

  private static getRecommendations(alert: any): string[] {
    const recommendations: Record<string, string[]> = {
      errorRate: [
        'Check server logs for error patterns',
        'Review recent code deployments',
        'Monitor system resources'
      ],
      loadTime: [
        'Check CDN configuration',
        'Review image optimization settings',
        'Monitor server response times'
      ],
      optimizationRatio: [
        'Review compression settings',
        'Check image formats and sizes',
        'Verify optimization pipeline'
      ]
    };

    return recommendations[alert.metric] || [];
  }

  private static async sendWebhookAlert(
    alert: any,
    webhookUrl: string
  ): Promise<void> {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
  }

  private static async sendSlackAlert(
    alert: any,
    channel: string
  ): Promise<void> {
    // Implement Slack notification logic here
    // This would use the Slack API to send messages
    console.log('Slack alert not implemented yet');
  }
}
