// src/controllers/user.controller.js
const BaseController = require('./base.controller');
const UserService = require('../services/user.service');
const ApiResponse = require('../libs/http/ApiResponse');
const ApiError = require('../libs/http/ApiError');
const NotificationService = require('../services/notification.service');

class UserController extends BaseController {
  constructor() {
    super(new UserService(), 'User');
    this.userService = new UserService();
    this.notificationService = new NotificationService();
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
      this.logger.info(`Profile image upload attempt by user ${req.user.id}`);

      // Log request details for debugging
      this.logger.debug('Upload request details:', {
        userId: req.user.id,
        hasFile: !!req.file,
        fileDetails: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          filename: req.file.filename
        } : null,
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent']
      });

      if (!req.file) {
        this.logger.warn(`No image file provided for user ${req.user.id}`);
        throw ApiError.badRequest('No image file provided');
      }

      // Additional validation for file size
      if (req.file.size === 0) {
        this.logger.warn(`Empty file provided for user ${req.user.id}`);
        throw ApiError.badRequest('Empty file provided');
      }

      const updatedUser = await this.userService.updateProfileImage(
        req.user.id,
        req.file
      );

      this.logger.info(`User ${req.user.id} uploaded profile image successfully: ${req.file.filename}`);

      res.status(200).json(
        ApiResponse.updated(
          { profileImage: updatedUser.profileImage },
          'Profile image uploaded successfully'
        )
      );
    } catch (error) {
      this.logger.error(`Profile image upload failed for user ${req.user.id}`, {
        error: error.message,
        stack: error.stack,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file attached'
      });
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

  async updateFCMToken(req, res) {
    const userId = req.user.id;
    const { fcmToken } = req.body;

    const result = await this.notificationService.updateFCMToken(userId, fcmToken);
    ApiResponse.success(res, result.message, result);
  }

  async removeFCMToken(req, res) {
    const userId = req.user.id;

    const result = await this.notificationService.removeFCMToken(userId);
    ApiResponse.success(res, result.message, result);
  }
}

module.exports = UserController;