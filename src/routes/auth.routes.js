// src/routes/auth.routes.js
const express = require('express');
const AuthController = require('../controllers/auth.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const schemas = require('../validations/schemas');

class AuthRoutes {
  constructor() {
    this.router = express.Router();
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Google OAuth login
    this.router.post(
      '/google',
      ValidationMiddleware.validate(schemas.googleAuth),
      ErrorMiddleware.asyncHandler(this.authController.googleAuth.bind(this.authController))
    );

    // Refresh token
    this.router.post(
      '/refresh',
      ValidationMiddleware.validate(schemas.refreshToken),
      ErrorMiddleware.asyncHandler(this.authController.refreshToken.bind(this.authController))
    );

    // Logout
    this.router.post(
      '/logout',
      AuthMiddleware.authenticate(),
      ErrorMiddleware.asyncHandler(this.authController.logout.bind(this.authController))
    );

    // Get current user
    this.router.get(
      '/me',
      AuthMiddleware.authenticate(),
      ErrorMiddleware.asyncHandler(this.authController.getCurrentUser.bind(this.authController))
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new AuthRoutes().getRouter();