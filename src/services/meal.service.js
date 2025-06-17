// src/services/meal.service.js
const BaseService = require('./base.service');
const CalorieUtil = require('../libs/utils/calorie.util');
const ApiError = require('../libs/http/ApiError');
const HttpStatus = require('../libs/http/HttpStatus');
const { parseDate } = require('../libs/utils/date');

class MealService extends BaseService {
  constructor() {
    super('userMeal');
  }

  async createMeal(data) {
    try {
      const { userId, foodId, mealType, date, quantity = 1, unit = "porsi" } = data;

      // Parse and validate date
      const parsedDate = parseDate(date);
      if (!parsedDate) {
        throw new ApiError('Invalid date format. Please use DD-MM-YYYY or ISO format', HttpStatus.BAD_REQUEST);
      }

      const food = await this.prisma.food.findUnique({
        where: { id: foodId, isActive: true },
        include: { category: true }
      });

      if (!food) {
        throw new ApiError('Food not found', HttpStatus.NOT_FOUND);
      }

      const totalCalories = food.calory * quantity;
      const totalProtein = food.protein * quantity;
      const totalFat = food.fat * quantity;
      const totalCarbs = food.carbohydrate * quantity;

      const meal = await this.prisma.userMeal.create({
        data: {
          userId,
          foodId,
          mealType,
          date: parsedDate,
          quantity,
          unit,
          totalCalories,
          totalProtein,
          totalFat,
          totalCarbs
        },
        include: {
          food: {
            include: { category: true }
          }
        }
      });

      return meal;
    } catch (error) {
      this.logger.error('Error creating meal:', error);
      throw error;
    }
  }

  async getUserMeals(userId, filters = {}) {
    try {
      const { page = 0, limit = 10, date, mealType } = filters;
      const skip = parseInt(page) * parseInt(limit);

      const where = { userId };
      if (date) {
        const parsedDate = parseDate(date);
        if (!parsedDate) {
          throw new ApiError('Invalid date format. Please use DD-MM-YYYY or ISO format', HttpStatus.BAD_REQUEST);
        }
        where.date = parsedDate;
      }
      if (mealType) where.mealType = mealType;

      const meals = await this.prisma.userMeal.findMany({
        where,
        include: {
          food: {
            include: { category: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      });

      const total = await this.prisma.userMeal.count({ where });

      return {
        data: meals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      this.logger.error('Error getting user meals:', error);
      throw error;
    }
  }

  async updateMeal(userId, mealId, data) {
    try {
      const existingMeal = await this.prisma.userMeal.findFirst({
        where: {
          id: mealId,
          userId
        },
        include: { food: true }
      });

      if (!existingMeal) {
        throw new ApiError('Meal not found', HttpStatus.NOT_FOUND);
      }

      const { quantity, unit } = data;
      const food = existingMeal.food;

      const totalCalories = food.calory * (quantity || existingMeal.quantity);
      const totalProtein = food.protein * (quantity || existingMeal.quantity);
      const totalFat = food.fat * (quantity || existingMeal.quantity);
      const totalCarbs = food.carbohydrate * (quantity || existingMeal.quantity);

      const updatedMeal = await this.prisma.userMeal.update({
        where: { id: mealId },
        data: {
          ...data,
          totalCalories,
          totalProtein,
          totalFat,
          totalCarbs
        },
        include: {
          food: {
            include: { category: true }
          }
        }
      });

      return updatedMeal;
    } catch (error) {
      this.logger.error('Error updating meal:', error);
      throw error;
    }
  }

  async deleteMeal(userId, mealId) {
    try {
      const meal = await this.prisma.userMeal.findFirst({
        where: {
          id: mealId,
          userId
        }
      });

      if (!meal) {
        throw new ApiError('Meal not found', HttpStatus.NOT_FOUND);
      }

      await this.prisma.userMeal.delete({
        where: { id: mealId }
      });

      return true;
    } catch (error) {
      this.logger.error('Error deleting meal:', error);
      throw error;
    }
  }

  async getDailySummary(userId, date) {
    try {
      const targetDate = parseDate(date);
      if (!targetDate) {
        throw new ApiError('Invalid date format. Please use DD-MM-YYYY or ISO format', HttpStatus.BAD_REQUEST);
      }

      const meals = await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: targetDate
        },
        include: {
          food: {
            include: { category: true }
          }
        }
      });

      const summary = {
        date: targetDate,
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalCarbs: 0,
        mealsByType: {
          BREAKFAST: [],
          LUNCH: [],
          DINNER: [],
          SNACK: []
        },
        nutritionBreakdown: {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0
        }
      };

      meals.forEach(meal => {
        summary.totalCalories += meal.totalCalories;
        summary.totalProtein += meal.totalProtein;
        summary.totalFat += meal.totalFat;
        summary.totalCarbs += meal.totalCarbs;

        summary.mealsByType[meal.mealType].push(meal);
      });

      summary.nutritionBreakdown = {
        calories: summary.totalCalories,
        protein: summary.totalProtein,
        fat: summary.totalFat,
        carbs: summary.totalCarbs
      };

      return summary;
    } catch (error) {
      this.logger.error('Error getting daily summary:', error);
      throw error;
    }
  }

  async getAllFoods(search = '', category = '', page = 0, limit = 50) {
    try {
      const skip = parseInt(page) * parseInt(limit);

      const where = {
        isActive: true,
        ...(search && {
          name: {
            contains: search
          }
        }),
        ...(category && {
          category: {
            slug: category
          }
        })
      };

      const foods = await this.prisma.food.findMany({
        where,
        include: {
          category: true
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: parseInt(limit)
      });

      const total = await this.prisma.food.count({ where });

      return {
        data: foods,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      this.logger.error('Error getting all foods:', error);
      throw error;
    }
  }

  async searchFoods(query, page = 0, limit = 20) {
    try {
      const skip = parseInt(page) * parseInt(limit);

      const foods = await this.prisma.food.findMany({
        where: {
          isActive: true,
          name: {
            contains: query
          }
        },
        include: {
          category: true
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: parseInt(limit)
      });

      const total = await this.prisma.food.count({
        where: {
          isActive: true,
          name: {
            contains: query
          }
        }
      });

      return {
        data: foods,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      this.logger.error('Error searching foods:', error);
      throw error;
    }
  }

  async getFoodDetails(foodId) {
    try {
      const food = await this.prisma.food.findUnique({
        where: {
          id: foodId,
          isActive: true
        },
        include: {
          category: true
        }
      });

      return food;
    } catch (error) {
      this.logger.error('Error getting food details:', error);
      throw error;
    }
  }

  async autoCompleteFood(query, limit = 10) {
    try {
      const foods = await this.prisma.food.findMany({
        where: {
          isActive: true,
          name: {
            contains: query
          }
        },
        select: {
          id: true,
          name: true,
          calory: true,
          category: {
            select: {
              name: true,
              slug: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        },
        take: parseInt(limit)
      });

      return foods;
    } catch (error) {
      this.logger.error('Error autocompleting foods:', error);
      throw error;
    }
  }

  async getFoodCategories() {
    try {
      const categories = await this.prisma.foodCategory.findMany({
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: {
              foods: {
                where: {
                  isActive: true
                }
              }
            }
          }
        }
      });

      return categories;
    } catch (error) {
      this.logger.error('Error getting food categories:', error);
      throw error;
    }
  }

  async addToFavorites(userId, foodId) {
    try {
      const food = await this.prisma.food.findUnique({
        where: { id: foodId, isActive: true }
      });

      if (!food) {
        throw new ApiError('Food not found', HttpStatus.NOT_FOUND);
      }

      const favorite = await this.prisma.favoriteFood.upsert({
        where: {
          userId_foodId: {
            userId,
            foodId
          }
        },
        update: {},
        create: {
          userId,
          foodId
        },
        include: {
          food: {
            include: { category: true }
          }
        }
      });

      return favorite;
    } catch (error) {
      this.logger.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(userId, foodId) {
    try {
      await this.prisma.favoriteFood.deleteMany({
        where: {
          userId,
          foodId
        }
      });

      return true;
    } catch (error) {
      this.logger.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async getFavorites(userId, page = 0, limit = 20) {
    try {
      const skip = parseInt(page) * parseInt(limit);

      const favorites = await this.prisma.favoriteFood.findMany({
        where: { userId },
        include: {
          food: {
            include: { category: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      });

      const total = await this.prisma.favoriteFood.count({
        where: { userId }
      });

      return {
        data: favorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      this.logger.error('Error getting favorites:', error);
      throw error;
    }
  }
}

module.exports = MealService;