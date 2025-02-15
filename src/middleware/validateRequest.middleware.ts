import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError } from 'joi';
import { BadRequestError } from '../utils/ApiError';

export const validateRequest = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map((detail: ValidationError['details'][0]) => detail.message);
            return next(new BadRequestError('Validation Error', errorMessages));
        }

        next();
    };
};
