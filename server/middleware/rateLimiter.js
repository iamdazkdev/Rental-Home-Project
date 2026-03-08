const rateLimit = require("express-rate-limit");

// Auth endpoints: strict limit (login brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Payment endpoints: moderate limit
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Too many payment requests. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API: generous limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, paymentLimiter, apiLimiter };
