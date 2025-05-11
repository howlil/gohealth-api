// src/middleware/error.middleware.js
const ApiError = require('../libs/http/ApiError');
const ApiResponse = require('../libs/http/ApiResponse');
const Logger = require('../libs/logger/Logger');

class ErrorMiddleware {
  notFound() {
    return (req, res, next) => {
      const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
      next(error);
    };
  }

  errorHandler() {
    return (err, req, res, next) => {
      let error = err;

      // If err is not an instance of ApiError, convert it
      if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(message, statusCode);
      }

      // Log error
      Logger.error(`${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
        stack: error.stack,
        body: req.body,
        params: req.params,
        query: req.query
      });

      // Send error response
      res.status(error.statusCode).json(
        ApiResponse.error(
          error.message,
          error.statusCode,
          error.errors
        )
      );
    };
  }

  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = new ErrorMiddleware();