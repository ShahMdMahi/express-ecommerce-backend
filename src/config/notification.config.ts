export interface NotificationConfig {
  email: {
    enabled: boolean;
    recipients: string[];
    errorThresholdOnly: boolean;
  };
  webhook: {
    enabled: boolean;
    url?: string;
    secret?: string;
  };
  slack: {
    enabled: boolean;
    webhook?: string;
    channel?: string;
  };
}

const isDevelopment = process.env.NODE_ENV !== 'production';

export const notificationConfig: NotificationConfig = {
  email: {
    enabled: !isDevelopment,
    recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(','),
    errorThresholdOnly: true
  },
  webhook: {
    enabled: !isDevelopment,
    url: process.env.ALERT_WEBHOOK_URL,
    secret: process.env.ALERT_WEBHOOK_SECRET
  },
  slack: {
    enabled: !isDevelopment,
    webhook: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_ALERT_CHANNEL
  }
};

if (!isDevelopment) {
  // Validate required configuration in production
  if (!process.env.ALERT_EMAIL_RECIPIENTS) {
    console.warn('No alert email recipients configured');
  }
}
