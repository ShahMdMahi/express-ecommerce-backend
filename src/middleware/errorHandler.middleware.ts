import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { appConfig } from '../config/app.config';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors,
            stack: appConfig.nodeEnv === 'development' ? error.stack : undefined
        });
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(error).map(err => err.message),
            stack: appConfig.nodeEnv === 'development' ? error.stack : undefined
        });
    }

    // Handle mongoose duplicate key errors
    if (error.name === 'MongoError' && (error as any).code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate key error',
            errors: Object.keys((error as any).keyValue).map(key => 
                `${key} already exists`
            ),
            stack: appConfig.nodeEnv === 'development' ? error.stack : undefined
        });
    }

    // Default error
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        stack: appConfig.nodeEnv === 'development' ? error.stack : undefined
    });
};
