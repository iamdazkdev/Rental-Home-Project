/**
 * Error Codes Constants for Rental Home Project Server
 * Centralized error code management for consistent API responses
 */

// HTTP Status Codes
const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Authentication & Authorization Errors
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Invalid email or password',
    status: HTTP_STATUS.UNAUTHORIZED
  },
  TOKEN_EXPIRED: {
    code: 'AUTH_002',
    message: 'Access token has expired',
    status: HTTP_STATUS.UNAUTHORIZED
  },
  TOKEN_INVALID: {
    code: 'AUTH_003',
    message: 'Invalid or malformed token',
    status: HTTP_STATUS.UNAUTHORIZED
  },
  TOKEN_MISSING: {
    code: 'AUTH_004',
    message: 'Access token is required',
    status: HTTP_STATUS.UNAUTHORIZED
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'AUTH_005',
    message: 'Insufficient permissions to access this resource',
    status: HTTP_STATUS.FORBIDDEN
  },
  ACCOUNT_LOCKED: {
    code: 'AUTH_006',
    message: 'Account has been locked due to security reasons',
    status: HTTP_STATUS.FORBIDDEN
  },
  ACCOUNT_NOT_VERIFIED: {
    code: 'AUTH_007',
    message: 'Please verify your email address to continue',
    status: HTTP_STATUS.FORBIDDEN
  }
};

// User Management Errors
const USER_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_001',
    message: 'User not found',
    status: HTTP_STATUS.NOT_FOUND
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'USER_002',
    message: 'An account with this email already exists',
    status: HTTP_STATUS.CONFLICT
  },
  INVALID_EMAIL_FORMAT: {
    code: 'USER_003',
    message: 'Please provide a valid email address',
    status: HTTP_STATUS.BAD_REQUEST
  },
  PASSWORD_TOO_WEAK: {
    code: 'USER_004',
    message: 'Password must be at least 8 characters long with uppercase, lowercase, and numbers',
    status: HTTP_STATUS.BAD_REQUEST
  },
  PROFILE_UPDATE_FAILED: {
    code: 'USER_005',
    message: 'Failed to update user profile',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  INVALID_USER_DATA: {
    code: 'USER_006',
    message: 'Invalid user data provided',
    status: HTTP_STATUS.BAD_REQUEST
  }
};

// Listing Management Errors
const LISTING_ERRORS = {
  LISTING_NOT_FOUND: {
    code: 'LISTING_001',
    message: 'Listing not found',
    status: HTTP_STATUS.NOT_FOUND
  },
  UNAUTHORIZED_LISTING_ACCESS: {
    code: 'LISTING_002',
    message: 'You are not authorized to access this listing',
    status: HTTP_STATUS.FORBIDDEN
  },
  INVALID_LISTING_DATA: {
    code: 'LISTING_003',
    message: 'Invalid listing data provided',
    status: HTTP_STATUS.BAD_REQUEST
  },
  MISSING_REQUIRED_FIELDS: {
    code: 'LISTING_004',
    message: 'Required fields are missing: title, description, price, location',
    status: HTTP_STATUS.BAD_REQUEST
  },
  INVALID_PRICE: {
    code: 'LISTING_005',
    message: 'Price must be a positive number',
    status: HTTP_STATUS.BAD_REQUEST
  },
  LISTING_CREATION_FAILED: {
    code: 'LISTING_006',
    message: 'Failed to create listing',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  LISTING_UPDATE_FAILED: {
    code: 'LISTING_007',
    message: 'Failed to update listing',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  LISTING_DELETE_FAILED: {
    code: 'LISTING_008',
    message: 'Failed to delete listing',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  INVALID_CATEGORY: {
    code: 'LISTING_009',
    message: 'Invalid category selected',
    status: HTTP_STATUS.BAD_REQUEST
  },
  INVALID_LOCATION: {
    code: 'LISTING_010',
    message: 'Invalid location data provided',
    status: HTTP_STATUS.BAD_REQUEST
  }
};

// File Upload Errors
const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: {
    code: 'UPLOAD_001',
    message: 'File size exceeds maximum limit of 10MB',
    status: HTTP_STATUS.BAD_REQUEST
  },
  INVALID_FILE_TYPE: {
    code: 'UPLOAD_002',
    message: 'Only image files (JPEG, PNG, WebP) are allowed',
    status: HTTP_STATUS.BAD_REQUEST
  },
  NO_FILE_UPLOADED: {
    code: 'UPLOAD_003',
    message: 'No file was uploaded',
    status: HTTP_STATUS.BAD_REQUEST
  },
  UPLOAD_FAILED: {
    code: 'UPLOAD_004',
    message: 'File upload failed. Please try again',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  TOO_MANY_FILES: {
    code: 'UPLOAD_005',
    message: 'Maximum 10 files allowed per listing',
    status: HTTP_STATUS.BAD_REQUEST
  },
  FILE_CORRUPTED: {
    code: 'UPLOAD_006',
    message: 'Uploaded file appears to be corrupted',
    status: HTTP_STATUS.BAD_REQUEST
  }
};

// Booking Errors
const BOOKING_ERRORS = {
  BOOKING_NOT_FOUND: {
    code: 'BOOKING_001',
    message: 'Booking not found',
    status: HTTP_STATUS.NOT_FOUND
  },
  LISTING_NOT_AVAILABLE: {
    code: 'BOOKING_002',
    message: 'Listing is not available for the selected dates',
    status: HTTP_STATUS.CONFLICT
  },
  INVALID_BOOKING_DATES: {
    code: 'BOOKING_003',
    message: 'Invalid booking dates. Check-in must be before check-out',
    status: HTTP_STATUS.BAD_REQUEST
  },
  PAST_DATE_BOOKING: {
    code: 'BOOKING_004',
    message: 'Cannot book dates in the past',
    status: HTTP_STATUS.BAD_REQUEST
  },
  SELF_BOOKING_NOT_ALLOWED: {
    code: 'BOOKING_005',
    message: 'You cannot book your own listing',
    status: HTTP_STATUS.BAD_REQUEST
  },
  BOOKING_ALREADY_EXISTS: {
    code: 'BOOKING_006',
    message: 'You already have a booking for this listing',
    status: HTTP_STATUS.CONFLICT
  },
  PAYMENT_FAILED: {
    code: 'BOOKING_007',
    message: 'Payment processing failed',
    status: HTTP_STATUS.BAD_REQUEST
  }
};

// Database Errors
const DATABASE_ERRORS = {
  CONNECTION_FAILED: {
    code: 'DB_001',
    message: 'Database connection failed',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  QUERY_FAILED: {
    code: 'DB_002',
    message: 'Database query failed',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  TRANSACTION_FAILED: {
    code: 'DB_003',
    message: 'Database transaction failed',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  DUPLICATE_ENTRY: {
    code: 'DB_004',
    message: 'Duplicate entry found',
    status: HTTP_STATUS.CONFLICT
  }
};

// Validation Errors
const VALIDATION_ERRORS = {
  REQUIRED_FIELD_MISSING: {
    code: 'VALIDATION_001',
    message: 'Required field is missing',
    status: HTTP_STATUS.BAD_REQUEST
  },
  INVALID_FORMAT: {
    code: 'VALIDATION_002',
    message: 'Invalid data format',
    status: HTTP_STATUS.BAD_REQUEST
  },
  VALUE_TOO_LONG: {
    code: 'VALIDATION_003',
    message: 'Value exceeds maximum length',
    status: HTTP_STATUS.BAD_REQUEST
  },
  VALUE_TOO_SHORT: {
    code: 'VALIDATION_004',
    message: 'Value is below minimum length',
    status: HTTP_STATUS.BAD_REQUEST
  },
  INVALID_RANGE: {
    code: 'VALIDATION_005',
    message: 'Value is outside valid range',
    status: HTTP_STATUS.BAD_REQUEST
  }
};

// Rate Limiting Errors
const RATE_LIMIT_ERRORS = {
  TOO_MANY_REQUESTS: {
    code: 'RATE_001',
    message: 'Too many requests. Please try again later',
    status: HTTP_STATUS.TOO_MANY_REQUESTS
  },
  LOGIN_ATTEMPTS_EXCEEDED: {
    code: 'RATE_002',
    message: 'Too many login attempts. Account temporarily locked',
    status: HTTP_STATUS.TOO_MANY_REQUESTS
  }
};

// Generic Server Errors
const SERVER_ERRORS = {
  INTERNAL_ERROR: {
    code: 'SERVER_001',
    message: 'Internal server error occurred',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVER_002',
    message: 'Service temporarily unavailable',
    status: HTTP_STATUS.SERVICE_UNAVAILABLE
  },
  NOT_IMPLEMENTED: {
    code: 'SERVER_003',
    message: 'Feature not implemented',
    status: HTTP_STATUS.NOT_IMPLEMENTED
  }
};

// Helper function to create standardized error response
const createErrorResponse = (error, details = null) => {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      details: details,
      timestamp: new Date().toISOString()
    }
  };
};

// Helper function to create success response
const createSuccessResponse = (data = null, message = 'Success') => {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  HTTP_STATUS,
  AUTH_ERRORS,
  USER_ERRORS,
  LISTING_ERRORS,
  UPLOAD_ERRORS,
  BOOKING_ERRORS,
  DATABASE_ERRORS,
  VALIDATION_ERRORS,
  RATE_LIMIT_ERRORS,
  SERVER_ERRORS,
  createErrorResponse,
  createSuccessResponse
};