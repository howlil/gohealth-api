// src/routes/bmi.routes.js
const express = require('express');
const BMIController = require('../controllers/bmi.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
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
      '/',
      ValidationMiddleware.validate(schemas.calculateBMI),
      ErrorMiddleware.asyncHandler(this.bmiController.calculateBMI.bind(this.bmiController))
    );

    // Get BMI history
    this.router.get(
      '/history',
      ValidationMiddleware.validate(schemas.pagination),
      ErrorMiddleware.asyncHandler(this.bmiController.getBMIHistory.bind(this.bmiController))
    );

    // Get latest BMI
    this.router.get(
      '/latest',
      ErrorMiddleware.asyncHandler(this.bmiController.getLatestBMI.bind(this.bmiController))
    );

    // Get BMI analysis
    this.router.get(
      '/analysis',
      ErrorMiddleware.asyncHandler(this.bmiController.getBMIAnalysis.bind(this.bmiController))
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
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new BMIRoutes().getRouter();