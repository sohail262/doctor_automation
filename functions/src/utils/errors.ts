export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message, 'RATE_LIMIT', 429);
        this.name = 'RateLimitError';
    }
}

export class ExternalAPIError extends AppError {
    constructor(service: string, message: string) {
        super(`${service} API error: ${message}`, 'EXTERNAL_API_ERROR', 502);
        this.name = 'ExternalAPIError';
    }
}