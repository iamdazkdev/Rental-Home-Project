const logger = require("../utils/logger");
const HttpError = require("../utils/HttpError");

/**
 * Async handler wrapper — eliminates try/catch boilerplate in controllers.
 * Usage: router.get("/", asyncHandler(controller.method))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware — must be registered LAST.
 */
const errorHandler = (err, req, res, next) => {
    logger.error("Global error handler:", err);

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: messages,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `Duplicate value for ${field}`,
        });
    }

    // Mongoose cast error (bad ObjectId)
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token expired",
        });
    }

    // Custom HttpError
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.code,
            message: err.message,
            details: err.details,
        });
    }

    // Default error
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && {
            error: { stack: err.stack, name: err.name },
        }),
    });
};

/**
 * 404 handler — must be registered after all routes, before errorHandler.
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.url}`,
        error: "Route not found",
    });
};

module.exports = { asyncHandler, errorHandler, notFoundHandler };
