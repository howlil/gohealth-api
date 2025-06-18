// src/routes/meal.routes.js
const express = require('express');
const MealController = require('../controllers/meal.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const PaginationMiddleware = require('../middleware/pagination.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const schemas = require('../validations/schemas');

class MealRoutes {
    constructor() {
        this.router = express.Router();
        this.mealController = new MealController();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // All routes require authentication
        this.router.use(AuthMiddleware.authenticate());

        // Get daily summary - path harus spesifik
        this.router.get(
            '/summary',
            ValidationMiddleware.validate(schemas.date),
            ErrorMiddleware.asyncHandler(this.mealController.getDailySummary.bind(this.mealController))
        );

        // PENTING: Urutan route /foods/* harus benar, dari yang paling spesifik ke umum

        // 1. Get food categories
        this.router.get(
            '/foods/categories',
            ErrorMiddleware.asyncHandler(this.mealController.getFoodCategories.bind(this.mealController))
        );

        // 2. Auto complete food search - paling spesifik
        this.router.get(
            '/foods/autocomplete',
            ErrorMiddleware.asyncHandler(this.mealController.autoCompleteFood.bind(this.mealController))
        );

        // 3. Search foods - juga spesifik
        this.router.get(
            '/foods/search',
            PaginationMiddleware.normalizePageNumber(),
            ValidationMiddleware.validate(schemas.pagination),
            ErrorMiddleware.asyncHandler(this.mealController.searchFoods.bind(this.mealController))
        );

        // 4. Get user favorites
        this.router.get(
            '/favorites',
            PaginationMiddleware.normalizePageNumber(),
            ValidationMiddleware.validate(schemas.pagination),
            ErrorMiddleware.asyncHandler(this.mealController.getFavorites.bind(this.mealController))
        );

        // 5. Add to favorites
        this.router.post(
            '/favorites/:foodId',
            ErrorMiddleware.asyncHandler(this.mealController.addToFavorites.bind(this.mealController))
        );

        // 6. Remove from favorites
        this.router.delete(
            '/favorites/:foodId',
            ErrorMiddleware.asyncHandler(this.mealController.removeFromFavorites.bind(this.mealController))
        );

        // 7. Get food details - parameter dinamis
        this.router.get(
            '/foods/:foodId',
            ErrorMiddleware.asyncHandler(this.mealController.getFoodDetails.bind(this.mealController))
        );

        // 8. Get all foods with filters - paling umum, harus di posisi terakhir
        this.router.get(
            '/foods',
            PaginationMiddleware.normalizePageNumber(),
            ValidationMiddleware.validate(schemas.pagination),
            ErrorMiddleware.asyncHandler(this.mealController.getAllFoods.bind(this.mealController))
        );

        // Create meal
        this.router.post(
            '/',
            ValidationMiddleware.validate(schemas.createMeal),
            ErrorMiddleware.asyncHandler(this.mealController.createMeal.bind(this.mealController))
        );

        // Get user meals
        this.router.get(
            '/',
            PaginationMiddleware.normalizePageNumber(),
            ValidationMiddleware.validate(schemas.pagination),
            ErrorMiddleware.asyncHandler(this.mealController.getUserMeals.bind(this.mealController))
        );

        // Update meal
        this.router.put(
            '/:mealId',
            ValidationMiddleware.validate(schemas.updateMeal),
            ErrorMiddleware.asyncHandler(this.mealController.updateMeal.bind(this.mealController))
        );

        // Delete meal
        this.router.delete(
            '/:mealId',
            ErrorMiddleware.asyncHandler(this.mealController.deleteMeal.bind(this.mealController))
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new MealRoutes().getRouter();