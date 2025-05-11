// src/libs/http/ApiError.js
class ApiError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = null) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static methodNotAllowed(message = 'Method not allowed') {
    return new ApiError(message, 405);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(message, 409);
  }

  static unprocessableEntity(message = 'Unprocessable entity', errors = null) {
    return new ApiError(message, 422, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, 429);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, 500);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(message, 503);
  }
}

module.exports = ApiError;