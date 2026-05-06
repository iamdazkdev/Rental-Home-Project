class HttpError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static BadRequest(message = 'Bad request', details = null) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }

  static Unauthorized(message = 'Unauthorized') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }

  static Forbidden(message = 'Forbidden') {
    return new HttpError(403, 'FORBIDDEN', message);
  }

  static NotFound(message = 'Resource not found') {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static Conflict(message = 'Resource conflict') {
    return new HttpError(409, 'CONFLICT', message);
  }

  static Internal(message = 'Internal server error') {
    return new HttpError(500, 'INTERNAL_ERROR', message);
  }
}

module.exports = HttpError;
