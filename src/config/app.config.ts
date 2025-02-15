export const appConfig = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    apiKeys: {
        required: true,
        headerKey: 'x-api-key',
        headerSecret: 'x-app-secret'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
};
