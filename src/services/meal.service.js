// src/services/meal.service.js
const BaseService = require('./base.service');
const CalorieUtil = require('../libs/utils/calorie.util');
const ApiError = require('../libs/http/ApiError');
const HttpStatus = require('../libs/http/HttpStatus');
const { parseDate, formatDate } = require('../libs/utils/date');
const NotificationService = require('./notification.service');

class MealService extends BaseService {
  constructor() {
    super('userMeal');
    this.notificationService = new NotificationService();
  }

  async createMeal(data) {
    try {
      const { userId, foodId, mealType, date, quantity = 1, unit = "porsi" } = data;

      // ✅ Validate quantity to prevent unrealistic values
      if (quantity <= 0 || quantity > 20) {
        throw new ApiError('Quantity must be between 0.1 and 20 servings for realistic portion sizes', HttpStatus.BAD_REQUEST);
      }

      // Date is now stored as string in DD-MM-YYYY format
      let dateString;
      if (date instanceof Date) {
        // If date comes as Date object from validation, format it
        dateString = formatDate(date);
      } else if (typeof date === 'string') {
        // Validate date format
        const parsedDate = parseDate(date);
        if (!parsedDate) {
          throw new ApiError('Invalid date format. Please use DD-MM-YYYY', HttpStatus.BAD_REQUEST);
        }
        dateString = date; // Use the string as-is
      } else {
        throw new ApiError('Invalid date format. Please use DD-MM-YYYY', HttpStatus.BAD_REQUEST);
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
          date: dateString, // Store as string
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

      this.logger.info(`Meal created successfully for user ${userId}: ${food.name} (${totalCalories} kcal)`);

      // Send meal logged notification
      try {
        const mealTypeText = mealType.charAt(0) + mealType.slice(1).toLowerCase();
        await this.notificationService.sendPushNotification(userId, {
          type: 'MEAL_LOGGED', // ✅ Fixed: Use proper type for meal confirmation
          title: `🍽️ ${mealTypeText} Logged!`,
          body: `You've logged ${food.name} (${Math.round(totalCalories)} kcal) for ${mealTypeText.toLowerCase()}. Keep tracking your nutrition!`,
          data: {
            type: 'MEAL_LOGGED',
            mealId: meal.id,
            foodName: food.name,
            mealType: mealType,
            calories: String(Math.round(totalCalories)),
            date: dateString,
            timestamp: new Date().toISOString()
          }
        });
        this.logger.info(`Meal logged notification sent to user ${userId}`);
      } catch (notifError) {
        this.logger.error(`Failed to send meal logged notification for user ${userId}:`, notifError);
        // Don't fail meal creation if notification fails
      }

      // Check daily calory achievement
      await this.checkDailyCaloryAchievement(userId, dateString);

      return meal;
    } catch (error) {
      this.logger.error('Error creating meal:', error);
      throw error;
    }
  }

  async getUserMeals(userId, filters = {}) {
    try {
      const { page = 1, limit = 10, date, mealType } = filters;
      // Convert to zero-based for skip calculation
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { userId };
      if (date) {
        // Date is now stored as string in DD-MM-YYYY format
        let dateString;
        if (date instanceof Date) {
          dateString = formatDate(date);
        } else if (typeof date === 'string') {
          // Validate date format
          const parsedDate = parseDate(date);
          if (!parsedDate) {
            throw new ApiError('Invalid date format. Please use DD-MM-YYYY', HttpStatus.BAD_REQUEST);
          }
          dateString = date;
        } else {
          throw new ApiError('Invalid date format. Please use DD-MM-YYYY', HttpStatus.BAD_REQUEST);
        }
        where.date = dateString;
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
      // Date is now stored as string in DD-MM-YYYY format
      let dateString;
      if (date instanceof Date) {
        dateString = formatDate(date);
      } else if (typeof date === 'string') {
        // Validate date format
        const parsedDate = parseDate(date);
        if (!parsedDate) {
          throw new ApiError('Invalid date format. Please use DD-MM-YYYY', HttpStatus.BAD_REQUEST);
        }
        dateString = date;
      } else {
        throw new ApiError('Invalid date format. Please use DD-MM-YYYY', HttpStatus.BAD_REQUEST);
      }

      const meals = await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: dateString
        },
        include: {
          food: {
            include: { category: true }
          }
        }
      });

      const summary = {
        date: dateString,
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

  async getAllFoods(search = '', category = '', page = 1, limit = 50) {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);

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

  async searchFoods(query, page = 1, limit = 20) {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);

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

  async getFavorites(userId, page = 1, limit = 20) {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);

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

  async checkDailyCaloryAchievement(userId, date) {
    try {
      this.logger.info(`Checking daily calory achievement for user ${userId} on date ${date}`);

      // Get user's latest BMI record for nutrition targets
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      if (!latestBMI) {
        this.logger.info(`No BMI record found for user ${userId}. Please calculate BMI first to set nutrition targets.`);
        return;
      }

      if (!latestBMI.nutritionSummary) {
        this.logger.info(`BMI record found for user ${userId} but no nutrition summary available`);
        return;
      }

      const nutritionSummary = latestBMI.nutritionSummary;
      const targetCalories = nutritionSummary.calories?.max || 0;

      if (!targetCalories) {
        this.logger.info(`No target calories found in nutrition summary for user ${userId}`);
        return;
      }

      this.logger.info(`Target calories for user ${userId}: ${targetCalories} kcal`);

      // Get daily summary for the date
      const dailySummary = await this.getDailySummary(userId, date);
      const currentCalories = dailySummary.totalCalories;

      this.logger.info(`Current calories consumed by user ${userId} on ${date}: ${currentCalories} kcal`);

      // Calculate percentage
      const percentage = Math.round((currentCalories / targetCalories) * 100);
      this.logger.info(`Calory achievement percentage for user ${userId}: ${percentage}% (${currentCalories}/${targetCalories})`);

      // ✅ Enhanced logic: Check for both achievement and abnormal values
      if (currentCalories > targetCalories * 5) {
        // If calories are more than 5x target, it's likely an error
        this.logger.warn(`⚠️ Abnormal calorie consumption detected for user ${userId}: ${currentCalories} kcal (${percentage}%). Please verify data accuracy.`);

        // Send warning notification
        try {
          await this.notificationService.sendPushNotification(userId, {
            type: 'SYSTEM_UPDATE',
            title: '⚠️ Unusual Calorie Data Detected',
            body: `Your logged calories (${Math.round(currentCalories)} kcal) seem unusually high. Please verify your meal quantities.`,
            data: {
              type: 'CALORIE_WARNING',
              currentCalories: String(Math.round(currentCalories)),
              targetCalories: String(Math.round(targetCalories)),
              percentage: String(percentage),
              timestamp: new Date().toISOString()
            }
          });
        } catch (notifError) {
          this.logger.error(`Failed to send calorie warning notification for user ${userId}:`, notifError);
        }
      } else if (percentage >= 80 && percentage <= 120) {
        // ✅ Expanded range: 80-120% for achievement (more realistic)
        this.logger.info(`User ${userId} achieved ${percentage}% of daily calory target - sending achievement notification`);

        // Check if notification already sent today
        const notificationKey = `calory_achievement_${userId}_${date}`;
        const alreadySent = await this.checkNotificationSent(notificationKey);

        if (alreadySent) {
          this.logger.info(`Daily calory achievement notification already sent for user ${userId} on ${date}`);
          return;
        }

        try {
          // Send push notification with dynamic message
          const achievementMessage = percentage >= 90 && percentage <= 110
            ? "Perfect! You've hit your daily calorie target!"
            : percentage < 90
              ? "Good progress! You're getting close to your calorie goal!"
              : "Great job! You've reached your calorie target!";

          await this.notificationService.sendDailyCaloryAchievementNotification(userId, {
            currentCalories: Math.round(currentCalories),
            targetCalories: Math.round(targetCalories),
            percentage,
            customMessage: achievementMessage
          });

          // Mark notification as sent
          await this.markNotificationSent(notificationKey);
          this.logger.info(`Daily calory achievement notification sent successfully to user ${userId}`);
        } catch (notifError) {
          this.logger.error(`Failed to send daily calory achievement notification for user ${userId}:`, notifError);
        }
      } else {
        this.logger.info(`User ${userId} has not yet achieved daily calory target: ${percentage}% (need 80-120% for achievement)`);
      }
    } catch (error) {
      this.logger.error('Error checking daily calory achievement:', error);
      // Don't throw error to not interrupt meal creation
    }
  }

  async checkNotificationSent(key) {
    // Simple in-memory check to prevent duplicate notifications
    // In production, you might want to use Redis or database
    if (!this.notificationsSent) {
      this.notificationsSent = new Set();
    }
    return this.notificationsSent.has(key);
  }

  async markNotificationSent(key) {
    if (!this.notificationsSent) {
      this.notificationsSent = new Set();
    }
    this.notificationsSent.add(key);

    // Clear old entries after 24 hours
    setTimeout(() => {
      this.notificationsSent.delete(key);
    }, 24 * 60 * 60 * 1000);
  }
}

module.exports = MealService;