// src/routes/user.routes.js
const express = require('express');
const UserController = require('../controllers/user.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

class UserRoutes {
  constructor() {
    this.router = express.Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Get user profile
    this.router.get(
      '/profile',
      AuthMiddleware.authenticate(),
      ErrorMiddleware.asyncHandler(this.userController.getProfile.bind(this.userController))
    );

    // Update user profile
    this.router.put(
      '/profile',
      AuthMiddleware.authenticate(),
      [
        body('name').optional().isString().trim(),
        body('age').optional().isInt({ min: 1, max: 120 }),
        body('gender').optional().isIn(['MALE', 'FEMALE']),
        body('height').optional().isFloat({ min: 50, max: 300 }),
        body('weight').optional().isFloat({ min: 20, max: 500 }),
        body('activityLevel').optional().isIn([
          'SEDENTARY',
          'LIGHTLY',
          'MODERATELY_ACTIVE',
          'VERY_ACTIVE',
          'EXTRA_ACTIVE'
        ])
      ],
      ValidationMiddleware.validate(),
      ErrorMiddleware.asyncHandler(this.userController.updateProfile.bind(this.userController))
    );

    // Upload profile image
    this.router.post(
      '/profile/image',
      AuthMiddleware.authenticate(),
      upload.single('image'),
      ErrorMiddleware.asyncHandler(this.userController.uploadProfileImage.bind(this.userController))
    );

    // Get dashboard data
    this.router.get(
      '/dashboard',
      AuthMiddleware.authenticate(),
      ErrorMiddleware.asyncHandler(this.userController.getDashboard.bind(this.userController))
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new UserRoutes().getRouter();