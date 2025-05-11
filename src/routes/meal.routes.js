// src/routes/meal.routes.js
const express = require('express');
const MealController = require('../controllers/meal.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const schemas = require('../database/validations/schemas');

class MealRoutes {
    constructor() {
        this.router = express.Router();
        this.mealController = new MealController();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // All routes require authentication
        this.router.use(AuthMiddleware.authenticate());

        // Create meal
        this.router.post(
            '/',
            ValidationMiddleware.validate(schemas.createMeal),
            ErrorMiddleware.asyncHandler(this.mealController.createMeal.bind(this.mealController))
        );

        // Get user meals
        this.router.get(
            '/',
            ValidationMiddleware.validate(schemas.dateRange),
            ErrorMiddleware.asyncHandler(this.mealController.getUserMeals.bind(this.mealController))
        );

        // Update meal
        this.router.put(
            '/:mealTypeId',
            ValidationMiddleware.validate(schemas.updateMeal),
            ErrorMiddleware.asyncHandler(this.mealController.updateMeal.bind(this.mealController))
        );

        // Delete meal
        this.router.delete(
            '/:mealTypeId',
            ErrorMiddleware.asyncHandler(this.mealController.deleteMeal.bind(this.mealController))
        );

        // Get daily summary
        this.router.get(
            '/summary',
            ValidationMiddleware.validate(schemas.date),
            ErrorMiddleware.asyncHandler(this.mealController.getDailySummary.bind(this.mealController))
        );

        // Search foods
        this.router.get(
            '/foods/search',
            ValidationMiddleware.validate(schemas.pagination),
            ErrorMiddleware.asyncHandler(this.mealController.searchFoods.bind(this.mealController))
        );

        // Get food details
        this.router.get(
            '/foods/:foodId',
            ErrorMiddleware.asyncHandler(this.mealController.getFoodDetails.bind(this.mealController))
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new MealRoutes().getRouter();