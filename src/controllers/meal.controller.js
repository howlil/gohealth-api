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
      const { page = 0, limit = 10, date, mealType } = req.query;
      const result = await this.mealService.getUserMeals(req.user.id, {
        page,
        limit,
        date,
        mealType
      });

      res.status(200).json(
        ApiResponse.success(result, 'User meals retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async updateMeal(req, res) {
    try {
      const { mealId } = req.params;
      const meal = await this.mealService.updateMeal(
        req.user.id,
        mealId,
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
      const { mealId } = req.params;
      await this.mealService.deleteMeal(req.user.id, mealId);

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
      const { query, page = 0, limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json(
          ApiResponse.error('Search query is required')
        );
      }

      const foods = await this.mealService.searchFoods(query, page, limit);

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

  async getAllFoods(req, res) {
    try {
      const { search = '', category = '', page = 0, limit = 50 } = req.query;

      const foods = await this.mealService.getAllFoods(
        search,
        category,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json(
        ApiResponse.success(foods, 'Foods retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async autoCompleteFood(req, res) {
    try {
      const { query = '', limit = 10 } = req.query;

      if (!query || query.length < 2) {
        return res.status(200).json(
          ApiResponse.success([], 'Query too short, minimum 2 characters required')
        );
      }

      const suggestions = await this.mealService.autoCompleteFood(
        query,
        parseInt(limit)
      );

      res.status(200).json(
        ApiResponse.success(suggestions, 'Food suggestions retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getFoodCategories(req, res) {
    try {
      const categories = await this.mealService.getFoodCategories();

      res.status(200).json(
        ApiResponse.success(categories, 'Food categories retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async addToFavorites(req, res) {
    try {
      const { foodId } = req.params;
      const favorite = await this.mealService.addToFavorites(req.user.id, foodId);

      res.status(201).json(
        ApiResponse.created(favorite, 'Food added to favorites successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async removeFromFavorites(req, res) {
    try {
      const { foodId } = req.params;
      await this.mealService.removeFromFavorites(req.user.id, foodId);

      res.status(200).json(
        ApiResponse.deleted('Food removed from favorites successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getFavorites(req, res) {
    try {
      const { page = 0, limit = 20 } = req.query;
      const favorites = await this.mealService.getFavorites(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json(
        ApiResponse.success(favorites, 'Favorite foods retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MealController;