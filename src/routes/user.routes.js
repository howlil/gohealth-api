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

const upload = multer({
  storage,
  limits: {
    fileSize: AppConfig.upload.maxFileSize // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
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
      ValidationMiddleware.validate(schemas.updateProfile),
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