// src/controllers/meal.controller.js
const BaseController = require('./base.controller');
const MealService = require('../services/meal.service');
const ApiResponse = require('../libs/http/ApiResponse');

class MealController extends BaseController {
  constructor() {
    super(new MealService(), 'Meal');
    this.mealService = new MealService();
  }

  async createMeal(req, res) {
    try {
      const meal = await this.mealService.createMeal({
        ...req.body,
        userId: req.user.id
      });

      this.logger.info(`User ${req.user.id} created a meal`);

      res.status(201).json(
        ApiResponse.created(meal, 'Meal created successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getUserMeals(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const meals = await this.mealService.getUserMeals(
        req.user.id,
        startDate,
        endDate
      );

      res.status(200).json(
        ApiResponse.success(meals, 'Meals retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async updateMeal(req, res) {
    try {
      const { mealTypeId } = req.params;
      const meal = await this.mealService.updateMeal(
        req.user.id,
        mealTypeId,
        req.body
      );

      res.status(200).json(
        ApiResponse.updated(meal, 'Meal updated successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteMeal(req, res) {
    try {
      const { mealTypeId } = req.params;
      await this.mealService.deleteMeal(req.user.id, mealTypeId);

      res.status(200).json(
        ApiResponse.deleted('Meal deleted successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getDailySummary(req, res) {
    try {
      const { date } = req.query;
      const summary = await this.mealService.getDailySummary(
        req.user.id,
        date
      );

      res.status(200).json(
        ApiResponse.success(summary, 'Daily summary retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async searchFoods(req, res) {
    try {
      const { query, page = 0 } = req.query;

      if (!query) {
        return res.status(400).json(
          ApiResponse.error('Search query is required')
        );
      }

      const foods = await this.mealService.searchFoods(query, page);

      res.status(200).json(
        ApiResponse.success(foods, 'Foods retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getFoodDetails(req, res) {
    try {
      const { foodId } = req.params;
      const food = await this.mealService.getFoodDetails(foodId);

      if (!food) {
        return res.status(404).json(
          ApiResponse.error('Food not found')
        );
      }

      res.status(200).json(
        ApiResponse.success(food, 'Food details retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MealController;