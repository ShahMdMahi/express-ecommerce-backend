export const CACHE = {
  TEMPLATE: {
    PREFIX: 'template:custom:',
    TTL: 3600 // 1 hour in seconds
  }
} as const;

export const PATHS = {
  TEMPLATES: {
    CUSTOM: 'templates/custom',
    NOTIFICATION: 'templates/notification'
  }
} as const;
