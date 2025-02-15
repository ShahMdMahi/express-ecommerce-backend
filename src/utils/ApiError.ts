export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors?: any[];

    constructor(
        statusCode: number,
        message: string,
        isOperational = true,
        errors?: any[]
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string, errors?: any[]) {
        super(400, message, true, errors);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized') {
        super(401, message, true);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden') {
        super(403, message, true);
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = 'Resource not found') {
        super(404, message, true);
    }
}
