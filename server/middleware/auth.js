const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            logger.auth('No authorization header provided');
            return res.status(401).json({message: 'Access token required'});
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            logger.auth('Token missing from authorization header');
            return res.status(401).json({message: 'Access token required'});
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                logger.error('Token verification failed:', err.message);
                return res.status(403).json({message: 'Invalid or expired token'});
            }

            logger.auth(`User authenticated: ${user._id || user.id || 'unknown'}`);
            req.user = user; // Attach user info to request
            next();
        });
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(500).json({message: 'Authentication failed'});
    }
};

/**
 * Check if user is host
 */
const isHost = (req, res, next) => {
    if (req.user && req.user.role === 'host') {
        next();
    } else {
        return res.status(403).json({message: 'Access denied. Host role required.'});
    }
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({message: 'Access denied. Admin role required.'});
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                req.user = null;
            } else {
                req.user = user;
            }
            next();
        });
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    isHost,
    isAdmin,
    optionalAuth
};

