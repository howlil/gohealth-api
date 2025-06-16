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
      this.logger.info(`Creating meal for user ${data.userId}`);

      const { userId, fatSecretFoodId, servingId, quantity, unit, nutritionData, mealTypeId, ...mealData } = data;
      this.logger.debug('Meal data:', { fatSecretFoodId, servingId, quantity, unit, mealTypeId, ...mealData });

      if (!mealTypeId) {
        this.logger.warn('Meal type ID is required');
        throw ApiError.badRequest('Meal type ID is required. Please provide a valid meal type ID from /api/meals/types');
      }

      // Verify meal type exists
      const mealType = await this.prisma.mealType.findUnique({
        where: { id: mealTypeId }
      });

      if (!mealType) {
        this.logger.warn(`Invalid meal type ID: ${mealTypeId}`);
        throw ApiError.badRequest('Invalid meal type ID. Please provide a valid meal type ID from /api/meals/types');
      }

      let finalNutritionData = nutritionData;
      if (fatSecretFoodId) {
        // Fetch nutrition data from FatSecret
        this.logger.debug('Fetching food data from FatSecret...');
        const foodData = await this.fatSecret.getFood(fatSecretFoodId);
        if (!foodData) {
          this.logger.warn(`Food not found in FatSecret: ${fatSecretFoodId}`);
          throw ApiError.notFound('Food not found');
        }
        // Find the selected serving
        this.logger.debug('Finding selected serving...');
        const serving = foodData.servings.find(s => s.servingId === servingId);
        if (!serving) {
          this.logger.warn(`Invalid serving ID: ${servingId}`);
          throw ApiError.badRequest('Invalid serving ID');
        }
        // Calculate nutrition for the quantity
        this.logger.debug('Calculating nutrition data...');
        finalNutritionData = this.fatSecret.calculateNutrition(serving, quantity, unit);
        this.logger.debug('Calculated nutrition:', finalNutritionData);
      }

      // Create meal with nutrition data
      this.logger.debug('Creating meal record in database...');
      const meal = await this.prisma.userMeal.create({
        data: {
          fatSecretFoodId: fatSecretFoodId || null,
          servingId: servingId || null,
          quantity,
          unit,
          nutritionData: finalNutritionData,
          foodName: mealData.foodName,
          brandName: mealData.brandName,
          date: new Date(mealData.date),
          user: {
            connect: { id: userId }
          },
          mealType: {
            connect: { id: mealTypeId }
          }
        },
        include: {
          mealType: true,
          user: true
        }
      });

      this.logger.info(`Meal created successfully for user ${userId}`);
      return meal;
    } catch (error) {
      this.logger.error('Error creating meal', {
        error: error.message,
        stack: error.stack,
        userId: data.userId,
        mealData: data
      });
      throw error;
    }
  }

  async getUserMeals(userId, startDate, endDate) {
    try {
      this.logger.info(`Fetching meals for user ${userId} from ${startDate} to ${endDate}`);

      this.logger.debug('Querying meals from database...');
      const meals = await this.prisma.userMeal.findMany({
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

      this.logger.debug(`Found ${meals.length} meals`);
      this.logger.info(`Meals retrieved successfully for user ${userId}`);
      return meals;
    } catch (error) {
      this.logger.error('Error getting user meals', {
        error: error.message,
        stack: error.stack,
        userId,
        startDate,
        endDate
      });
      throw error;
    }
  }

  async updateMeal(userId, mealTypeId, data) {
    try {
      this.logger.info(`Updating meal for user ${userId}, meal type ${mealTypeId}`);

      this.logger.debug('Finding existing meal...');
      const existingMeal = await this.prisma.userMeal.findFirst({
        where: {
          userId,
          mealTypeId,
          date: data.date
        }
      });

      if (!existingMeal) {
        this.logger.warn(`Meal not found for user ${userId}, meal type ${mealTypeId}`);
        throw ApiError.notFound('Meal not found');
      }

      let nutritionData = existingMeal.nutritionData;

      // Recalculate nutrition if quantity or serving changed
      if (data.servingId !== existingMeal.servingId || data.quantity !== existingMeal.quantity) {
        this.logger.debug('Recalculating nutrition data...');
        const foodData = await this.fatSecret.getFood(existingMeal.fatSecretFoodId);
        const serving = foodData.servings.find(s => s.servingId === data.servingId);

        if (!serving) {
          this.logger.warn(`Invalid serving ID: ${data.servingId}`);
          throw ApiError.badRequest('Invalid serving ID');
        }

        nutritionData = this.fatSecret.calculateNutrition(serving, data.quantity, data.unit);
        this.logger.debug('Recalculated nutrition:', nutritionData);
      }

      this.logger.debug('Updating meal record...');
      const updatedMeal = await this.prisma.userMeal.update({
        where: {
          userId_mealTypeId_date: {
            userId,
            mealTypeId,
            date: existingMeal.date
          }
        },
        data: {
          ...data,
          nutritionData
        },
        include: {
          mealType: true,
          user: true
        }
      });

      this.logger.info(`Meal updated successfully for user ${userId}`);
      return updatedMeal;
    } catch (error) {
      this.logger.error('Error updating meal', {
        error: error.message,
        stack: error.stack,
        userId,
        mealTypeId,
        updateData: data
      });
      throw error;
    }
  }

  async deleteMeal(userId, mealTypeId) {
    try {
      this.logger.info(`Deleting meal for user ${userId}, meal type ${mealTypeId}`);

      this.logger.debug('Finding meal to delete...');
      const meal = await this.prisma.userMeal.findUnique({
        where: {
          userId_mealTypeId: {
            userId,
            mealTypeId
          }
        }
      });

      if (!meal) {
        this.logger.warn(`Meal not found for user ${userId}, meal type ${mealTypeId}`);
        throw ApiError.notFound('Meal not found');
      }

      this.logger.debug('Deleting meal record...');
      await this.prisma.userMeal.delete({
        where: {
          userId_mealTypeId: {
            userId,
            mealTypeId
          }
        }
      });

      this.logger.info(`Meal deleted successfully for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting meal', {
        error: error.message,
        stack: error.stack,
        userId,
        mealTypeId
      });
      throw error;
    }
  }

  async getDailySummary(userId, date) {
    try {
      this.logger.info(`Fetching daily meal summary for user ${userId} on ${date}`);

      this.logger.debug('Querying meals for the day...');
      const meals = await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: new Date(date)
        }
      });

      this.logger.debug(`Found ${meals.length} meals`);

      this.logger.debug('Calculating nutrition summary...');
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

      this.logger.debug('Nutrition summary:', summary);

      this.logger.debug('Fetching nutrition targets...');
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

      const result = {
        summary,
        targets,
        meals
      };

      this.logger.info(`Daily meal summary retrieved successfully for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error('Error getting daily summary', {
        error: error.message,
        stack: error.stack,
        userId,
        date
      });
      throw error;
    }
  }

  async searchFoods(query, page = 0) {
    try {
      this.logger.info(`Searching foods with query: "${query}", page: ${page}`);

      this.logger.debug('Calling FatSecret API...');
      const results = await this.fatSecret.searchFoods(query, page);

      this.logger.debug(`Found ${results.length} results`);
      this.logger.info('Food search completed successfully');
      return results;
    } catch (error) {
      this.logger.error('Error searching foods', {
        error: error.message,
        stack: error.stack,
        query,
        page
      });
      throw error;
    }
  }

  async getFoodDetails(foodId) {
    try {
      this.logger.info(`Fetching food details for ID: ${foodId}`);

      this.logger.debug('Calling FatSecret API...');
      const foodDetails = await this.fatSecret.getFood(foodId);

      if (!foodDetails) {
        this.logger.warn(`Food not found: ${foodId}`);
        throw ApiError.notFound('Food not found');
      }

      this.logger.info('Food details retrieved successfully');
      return foodDetails;
    } catch (error) {
      this.logger.error('Error getting food details', {
        error: error.message,
        stack: error.stack,
        foodId
      });
      throw error;
    }
  }

  async getMealTypes() {
    try {
      this.logger.info('Fetching meal types');
      const mealTypes = await this.prisma.mealType.findMany({
        orderBy: {
          orderIndex: 'asc'
        }
      });
      this.logger.info(`Found ${mealTypes.length} meal types`);
      return mealTypes;
    } catch (error) {
      this.logger.error('Error fetching meal types', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = MealService;