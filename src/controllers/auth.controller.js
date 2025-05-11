// src/controllers/auth.controller.js
const AuthService = require('../services/auth.service');
const ApiResponse = require('../libs/http/ApiResponse');
const ApiError = require('../libs/http/ApiError');
const Logger = require('../libs/logger/Logger');

class AuthController {
  constructor() {
    this.authService = new AuthService();
    this.logger = Logger;
  }

  async googleAuth(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        throw ApiError.badRequest('Google ID token is required');
      }

      const result = await this.authService.googleAuth(idToken);

      this.logger.info(`User ${result.user.id} authenticated via Google`);

      res.status(200).json(
        ApiResponse.success(result, 'Authentication successful')
      );
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw ApiError.badRequest('Refresh token is required');
      }

      const result = await this.authService.refreshToken(refreshToken);

      this.logger.info('Token refreshed successfully');

      res.status(200).json(
        ApiResponse.success(result, 'Token refreshed successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async logout(req, res) {
    try {
      await this.authService.logout(req.user.id);

      this.logger.info(`User ${req.user.id} logged out`);

      res.status(200).json(
        ApiResponse.success(null, 'Logged out successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await this.authService.getCurrentUser(req.user.id);

      res.status(200).json(
        ApiResponse.success(user, 'Current user retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthController;