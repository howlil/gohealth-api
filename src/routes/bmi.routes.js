// src/routes/bmi.routes.js
const express = require('express');
const BMIController = require('../controllers/bmi.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const PaginationMiddleware = require('../middleware/pagination.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const schemas = require('../validations/schemas');

class BMIRoutes {
  constructor() {
    this.router = express.Router();
    this.bmiController = new BMIController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // All routes require authentication
    this.router.use(AuthMiddleware.authenticate());

    // Calculate and save BMI
    this.router.post(
      '/calculate',
      ValidationMiddleware.validate(schemas.calculateBMI),
      ErrorMiddleware.asyncHandler(this.bmiController.calculateBMI.bind(this.bmiController))
    );

    // Get BMI history
    this.router.get(
      '/history',
      PaginationMiddleware.normalizePageNumber(),
      ValidationMiddleware.validate(schemas.pagination),
      ErrorMiddleware.asyncHandler(this.bmiController.getBMIHistory.bind(this.bmiController))
    );

    // Delete BMI record
    this.router.delete(
      '/:bmiId',
      ErrorMiddleware.asyncHandler(this.bmiController.deleteBMI.bind(this.bmiController))
    );

    // Update BMI record
    this.router.put(
      '/:bmiId',
      ValidationMiddleware.validate(schemas.updateBMI),
      ErrorMiddleware.asyncHandler(this.bmiController.updateBMI.bind(this.bmiController))
    );

    // Create weight goal
    this.router.post(
      '/goals',
      ValidationMiddleware.validate(schemas.createWeightGoal),
      ErrorMiddleware.asyncHandler(this.bmiController.createWeightGoal.bind(this.bmiController))
    );

    // Get active weight goal
    this.router.get(
      '/goals/active',
      ErrorMiddleware.asyncHandler(this.bmiController.getActiveWeightGoal.bind(this.bmiController))
    );

    // Update weight goal
    this.router.put(
      '/goals/:goalId',
      ValidationMiddleware.validate(schemas.updateWeightGoal),
      ErrorMiddleware.asyncHandler(this.bmiController.updateWeightGoal.bind(this.bmiController))
    );

    // Delete weight goal
    this.router.delete(
      '/goals/:goalId',
      ErrorMiddleware.asyncHandler(this.bmiController.deleteWeightGoal.bind(this.bmiController))
    );
  }
}

module.exports = new BMIRoutes().router;
