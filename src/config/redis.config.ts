import Redis from 'ioredis';
import { appConfig } from './app.config';

const redisClient = new Redis({
    host: appConfig.redis.host,
    port: appConfig.redis.port,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.ping();
        console.log('Redis Client Connected');
    } catch (error) {
        console.error('Redis Connection Error:', error);
        throw error;
    }
};

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

export default redisClient;
