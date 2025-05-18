// src/services/meal.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const FatSecretUtil = require('../libs/utils/fatsecret.util');
const AppConfig = require('../config/app.config');

class MealService extends BaseService {
  constructor() {
    super('userMeal');
    this.fatSecret = new FatSecretUtil(
      AppConfig.fatSecret.clientId,
      AppConfig.fatSecret.clientSecret
    );
  }

  async createMeal(data) {
    try {
      const { userId, fatSecretFoodId, servingId, quantity, unit, ...mealData } = data;

      // Fetch nutrition data from FatSecret
      const foodData = await this.fatSecret.getFood(fatSecretFoodId);
      if (!foodData) {
        throw ApiError.notFound('Food not found');
      }

      // Find the selected serving
      const serving = foodData.servings.find(s => s.servingId === servingId);
      if (!serving) {
        throw ApiError.badRequest('Invalid serving ID');
      }

      // Calculate nutrition for the quantity
      const nutritionData = this.fatSecret.calculateNutrition(serving, quantity, unit);

      // Create meal with nutrition data
      return await this.prisma.userMeal.create({
        data: {
          userId,
          fatSecretFoodId,
          servingId,
          quantity,
          unit,
          nutritionData,
          ...mealData
        },
        include: {
          mealType: true
        }
      });
    } catch (error) {
      this.logger.error(`Error creating meal: ${error.message}`);
      throw error;
    }
  }

  async getUserMeals(userId, startDate, endDate) {
    try {
      return await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          mealType: true
        },
        orderBy: [
          { date: 'desc' },
          { mealType: { orderIndex: 'asc' } }
        ]
      });
    } catch (error) {
      this.logger.error(`Error getting user meals: ${error.message}`);
      throw error;
    }
  }

  async updateMeal(userId, mealTypeId, data) {
    try {
      const existingMeal = await this.prisma.userMeal.findUnique({
        where: { 
          userId_mealTypeId: {
            userId,
            mealTypeId
          }
        }
      });

      if (!existingMeal) {
        throw ApiError.notFound('Meal not found');
      }

      let nutritionData = existingMeal.nutritionData;
      
      // Recalculate nutrition if quantity or serving changed
      if (data.servingId !== existingMeal.servingId || data.quantity !== existingMeal.quantity) {
        const foodData = await this.fatSecret.getFood(existingMeal.fatSecretFoodId);
        const serving = foodData.servings.find(s => s.servingId === data.servingId);
        
        if (!serving) {
          throw ApiError.badRequest('Invalid serving ID');
        }
        
        nutritionData = this.fatSecret.calculateNutrition(serving, data.quantity, data.unit);
      }

      return await this.prisma.userMeal.update({
        where: { 
          userId_mealTypeId: {
            userId,
            mealTypeId
          }
        },
        data: {
          ...data,
          nutritionData
        },
        include: {
          mealType: true
        }
      });
    } catch (error) {
      this.logger.error(`Error updating meal: ${error.message}`);
      throw error;
    }
  }

  async deleteMeal(userId, mealTypeId) {
    try {
      const meal = await this.prisma.userMeal.findUnique({
        where: { 
          userId_mealTypeId: {
            userId,
            mealTypeId
          }
        }
      });

      if (!meal) {
        throw ApiError.notFound('Meal not found');
      }

      await this.prisma.userMeal.delete({
        where: { 
          userId_mealTypeId: {
            userId,
            mealTypeId
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting meal: ${error.message}`);
      throw error;
    }
  }

  async getDailySummary(userId, date) {
    try {
      const meals = await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: new Date(date)
        }
      });

      const summary = meals.reduce((acc, meal) => {
        const nutrition = meal.nutritionData;
        
        acc.calories += nutrition.calories || 0;
        acc.protein += nutrition.protein || 0;
        acc.carbohydrates += nutrition.carbohydrate || 0;
        acc.fat += nutrition.fat || 0;
        acc.fiber += nutrition.fiber || 0;
        acc.sugar += nutrition.sugar || 0;

        return acc;
      }, {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0
      });

      const targets = await this.prisma.dailyNutritionTarget.findFirst({
        where: {
          userId,
          isActive: true,
          effectiveDate: {
            lte: new Date(date)
          }
        },
        orderBy: {
          effectiveDate: 'desc'
        }
      });

      return {
        summary,
        targets,
        meals
      };
    } catch (error) {
      this.logger.error(`Error getting daily summary: ${error.message}`);
      throw error;
    }
  }

  async searchFoods(query, page = 0) {
    try {
      return await this.fatSecret.searchFoods(query, page);
    } catch (error) {
      this.logger.error(`Error searching foods: ${error.message}`);
      throw error;
    }
  }

  async getFoodDetails(foodId) {
    try {
      return await this.fatSecret.getFood(foodId)
    } catch (error) {
      this.logger.error(`Error getting food details: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MealService;