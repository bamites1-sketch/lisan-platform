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
    return res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again later.'
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map