import { Redis, ChainableCommander } from 'ioredis';

// Base interface for Redis metrics with index signature
interface RedisMetricsBase {
  [key: string]: string;
}

// Required metrics fields with strict types
interface RequiredMetrics {
  views: string;
  totalLoadTime: string;
  errors: string;
  sizeReduction: string;
}

// Combine both interfaces for complete type definition
interface RedisMetrics extends RequiredMetrics, RedisMetricsBase {}

export const getRedisKey = (prefix: string, identifier: string): string => {
  return `${prefix}:${identifier}`;
};

export const parseRedisMetrics = (data: Record<string, string | undefined>): RedisMetrics => {
  // Create metrics object with required fields
  const metrics = {
    views: data.views ?? '0',
    totalLoadTime: data.totalLoadTime ?? '0',
    errors: data.errors ?? '0',
    sizeReduction: data.sizeReduction ?? '0'
  } as RedisMetrics;

  // Add any additional fields from data
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && !Object.keys(metrics).includes(key)) {
      metrics[key] = value;
    }
  });

  return metrics;
};

export const redisCommands = {
    setex: (client: Redis, key: string, seconds: number, value: string) => 
        client.setex(key, seconds, value),
    hgetall: (client: Redis, key: string) => 
        client.hgetall(key),
    hincrby: (client: Redis | ChainableCommander, key: string, field: string, increment: number) => 
        client.hincrby(key, field, increment),
    lrange: (client: Redis, key: string, start: number, stop: number) => 
        client.lrange(key, start, stop),
    hgetall_typed: async <T extends Record<string, string>>(client: Redis, key: string): Promise<T | null> => {
        const data = await client.hgetall(key);
        return data ? (data as T) : null;
    }
};
