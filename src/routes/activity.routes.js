// src/routes/activity.routes.js
const express = require('express');
const ActivityController = require('../controllers/activity.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const schemas = require('../validations/schemas');

class ActivityRoutes {
  constructor() {
    this.router = express.Router();
    this.activityController = new ActivityController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // All routes require authentication
    this.router.use(AuthMiddleware.authenticate());

    // Get activity types
    this.router.get(
      '/types',
      ErrorMiddleware.asyncHandler(this.activityController.getActivityTypes.bind(this.activityController))
    );

    // Create activity
    this.router.post(
      '/',
      ValidationMiddleware.validate(schemas.createActivity),
      ErrorMiddleware.asyncHandler(this.activityController.createActivity.bind(this.activityController))
    );

    // Get user activities
    this.router.get(
      '/',
      ValidationMiddleware.validate(schemas.dateRange),
      ErrorMiddleware.asyncHandler(this.activityController.getUserActivities.bind(this.activityController))
    );

    // Get daily summary
    this.router.get(
      '/summary',
      ValidationMiddleware.validate(schemas.date),
      ErrorMiddleware.asyncHandler(this.activityController.getDailySummary.bind(this.activityController))
    );

    // Update activity
    this.router.put(
      '/:activityTypeId',
      ValidationMiddleware.validate(schemas.updateActivity),
      ErrorMiddleware.asyncHandler(this.activityController.updateActivity.bind(this.activityController))
    );

    // Delete activity
    this.router.delete(
      '/:activityTypeId',
      ErrorMiddleware.asyncHandler(this.activityController.deleteActivity.bind(this.activityController))
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new ActivityRoutes().getRouter();