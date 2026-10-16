"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }
    // Log unexpected errors
    console.error('Unexpected Error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
        success: false,
        message: isProd ? 'An unexpected error occurred. Please try again later.' : (err?.message || 'Something went wrong.'),
        ...(isProd ? {} : { error: err?.message }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map