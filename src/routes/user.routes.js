// src/routes/user.routes.js
const express = require('express');
const UserController = require('../controllers/user.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const schemas = require('../validations/schemas');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppConfig = require('../config/app.config');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), AppConfig.upload.uploadDir, 'profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Enhanced file filter with MIME type and extension validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  // Get file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check MIME type first
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);

  // Check file extension as fallback
  const isValidExtension = allowedExtensions.includes(fileExtension);

  // Accept if either MIME type or extension is valid (for Flutter/mobile compatibility)
  if (isValidMimeType || isValidExtension) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: AppConfig.upload.maxFileSize // 5MB
  },
  fileFilter
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
      ValidationMiddleware.validate(schemas.updateProfile),
      ErrorMiddleware.asyncHandler(this.userController.updateProfile.bind(this.userController))
    );

    // Upload profile image with enhanced error handling
    this.router.post(
      '/profile/image',
      AuthMiddleware.authenticate(),
      (req, res, next) => {
        upload.single('image')(req, res, (err) => {
          if (err) {
            // Handle multer-specific errors
            if (err instanceof multer.MulterError) {
              if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                  success: false,
                  message: 'File size too large. Maximum size is 5MB.',
                  error: 'FILE_TOO_LARGE'
                });
              }
              if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                  success: false,
                  message: 'Invalid field name. Use "image" as field name.',
                  error: 'INVALID_FIELD_NAME'
                });
              }
            }

            // Handle file type validation errors
            if (err.message.includes('Only image files')) {
              return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.',
                error: 'INVALID_FILE_TYPE',
                details: {
                  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                }
              });
            }

            // Generic multer error
            return res.status(400).json({
              success: false,
              message: err.message || 'File upload failed',
              error: 'UPLOAD_ERROR'
            });
          }
          next();
        });
      },
      ErrorMiddleware.asyncHandler(this.userController.uploadProfileImage.bind(this.userController))
    );

    // Get dashboard data
    this.router.get(
      '/dashboard',
      AuthMiddleware.authenticate(),
      ValidationMiddleware.validate(schemas.getDashboard),
      ErrorMiddleware.asyncHandler(this.userController.getDashboard.bind(this.userController))
    );

    // Update FCM token
    this.router.put(
      '/fcm-token',
      AuthMiddleware.authenticate(),
      ValidationMiddleware.validate(schemas.updateFCMToken),
      ErrorMiddleware.asyncHandler(this.userController.updateFCMToken.bind(this.userController))
    );

    // Remove FCM token
    this.router.delete(
      '/fcm-token',
      AuthMiddleware.authenticate(),
      ErrorMiddleware.asyncHandler(this.userController.removeFCMToken.bind(this.userController))
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new UserRoutes().getRouter();