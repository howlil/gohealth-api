// src/middleware/auth.middleware.js
const passport = require('passport');
const ApiError = require('../libs/http/ApiError');
const ApiResponse = require('../libs/http/ApiResponse');
const Logger = require('../libs/logger/Logger');

class AuthMiddleware {
  authenticate() {
    return (req, res, next) => {
      passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
          Logger.error('Authentication error', err);
          return next(ApiError.internal('Authentication error'));
        }

        if (!user) {
          Logger.warn(`Authentication failed: ${info?.message || 'Unknown reason'}`);
          return res.status(401).json(
            ApiResponse.error('Authentication failed', 401, {
              reason: info?.message || 'Invalid or expired token'
            })
          );
        }

        req.user = user;
        next();
      })(req, res, next);
    };
  }

  requireRoles(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      if (!roles.includes(req.user.role)) {
        Logger.warn(`Access denied for user ${req.user.id} - Required roles: ${roles.join(', ')}`);
        return res.status(403).json(
          ApiResponse.error('Insufficient permissions', 403)
        );
      }

      next();
    };
  }

  optionalAuth() {
    return (req, res, next) => {
      passport.authenticate('jwt', { session: false }, (err, user) => {
        if (user) {
          req.user = user;
        }
        next();
      })(req, res, next);
    };
  }
}

module.exports = new AuthMiddleware();