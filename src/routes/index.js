// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const mealRoutes = require('./meal.routes');
const activityRoutes = require('./activity.routes');
const bmiRoutes = require('./bmi.routes');
const notificationRoutes = require('./notification.routes');
const ApiResponse = require('../libs/http/ApiResponse');

class Routes {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Health check endpoint
    this.router.get('/health', (req, res) => {
      res.status(200).json(
        ApiResponse.success({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV
        }, 'Service is healthy')
      );
    });

    // API info endpoint
    this.router.get('/info', (req, res) => {
      res.status(200).json(
        ApiResponse.success({
          name: 'GoHealth API',
          version: '1.0.0',
          description: 'Health and fitness tracking API'
        }, 'API information')
      );
    });

    // Mount routes
    this.router.use('/auth', authRoutes);
    this.router.use('/users', userRoutes);
    this.router.use('/meals', mealRoutes);
    this.router.use('/activities', activityRoutes);
    this.router.use('/bmi', bmiRoutes);
    this.router.use('/notifications', notificationRoutes);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new Routes().getRouter();