// src/controllers/user.controller.js
const BaseController = require('./base.controller');
const UserService = require('../services/user.service');
const ApiResponse = require('../libs/http/ApiResponse');
const ApiError = require('../libs/http/ApiError');

class UserController extends BaseController {
  constructor() {
    super(new UserService(), 'User');
    this.userService = new UserService();
  }

  async getProfile(req, res) {
    try {
      const user = await this.userService.getProfile(req.user.id);

      if (!user) {
        throw ApiError.notFound('User profile not found');
      }

      this.logger.info(`User ${req.user.id} retrieved profile`);

      res.status(200).json(
        ApiResponse.success(user, 'Profile retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(req, res) {
    try {
      const updatedUser = await this.userService.updateProfile(req.user.id, req.body);

      this.logger.info(`User ${req.user.id} updated profile`);

      res.status(200).json(
        ApiResponse.updated(updatedUser, 'Profile updated successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async uploadProfileImage(req, res) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file provided');
      }

      const updatedUser = await this.userService.updateProfileImage(
        req.user.id,
        req.file
      );

      this.logger.info(`User ${req.user.id} uploaded profile image`);

      res.status(200).json(
        ApiResponse.updated(
          { profileImage: updatedUser.profileImage },
          'Profile image uploaded successfully'
        )
      );
    } catch (error) {
      throw error;
    }
  }

  async getDashboard(req, res) {
    try {
      const { formatDate } = require('../libs/utils/date');
      const { date = formatDate(new Date()), range = 'week', month = null } = req.query;
      const dashboard = await this.userService.getDashboardData(req.user.id, date, range, month);

      this.logger.info(`User ${req.user.id} accessed dashboard for date: ${date}, range: ${range}, month: ${month}`);

      res.status(200).json(
        ApiResponse.success(dashboard, 'Dashboard data retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserController;