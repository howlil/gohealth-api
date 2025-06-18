// src/services/user.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');
const { parseDate, formatDate } = require('../libs/utils/date');

class UserService extends BaseService {
  constructor() {
    super('user');
    this.calorieUtil = new CalorieUtil();
  }

  async getProfile(userId) {
    try {
      this.logger.info(`Fetching profile for user ID: ${userId}`);

      this.logger.debug('Finding user in database...');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          gender: true,
          height: true,
          weight: true,
          activityLevel: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        this.logger.warn(`Profile not found for user ID: ${userId}`);
        throw ApiError.notFound('User not found');
      }

      // Add calculated fields
      if (user.weight && user.height && user.age && user.gender) {
        this.logger.debug('Calculating BMR and TDEE...');
        user.bmr = this.calorieUtil.calculateBMR(
          user.weight,
          user.height,
          user.age,
          user.gender
        );

        user.tdee = this.calorieUtil.calculateTDEE(
          user.bmr,
          user.activityLevel
        );
        this.logger.debug(`Calculated BMR: ${user.bmr}, TDEE: ${user.tdee}`);
      }

      this.logger.info(`Profile retrieved successfully for user ${userId}`);
      return user;
    } catch (error) {
      this.logger.error('Error getting user profile', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  async updateProfile(userId, data) {
    try {
      this.logger.info(`Updating profile for user ID: ${userId}`);

      // Validate allowed fields for update
      const allowedFields = ['name', 'age', 'gender', 'height', 'weight', 'activityLevel'];
      const updateData = Object.keys(data)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      this.logger.debug('Updating user record with data:', updateData);
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      this.logger.info(`Profile updated successfully for user ${userId}`);
      return this.getProfile(userId);
    } catch (error) {
      this.logger.error('Error updating user profile', {
        error: error.message,
        stack: error.stack,
        userId,
        updateData: data
      });
      throw error;
    }
  }

  async updateProfileImage(userId, imageFile) {
    try {
      this.logger.info(`Updating profile image for user ID: ${userId}`);

      if (!imageFile) {
        this.logger.warn('No image file provided for profile update');
        throw ApiError.badRequest('No image file provided');
      }

      // Generate relative URL for the image
      const imageUrl = `/uploads/profile/${userId}/${imageFile.filename}`;
      this.logger.debug(`Generated image URL: ${imageUrl}`);

      // Update user record with new image URL
      this.logger.debug('Updating user record with new image URL...');
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl }
      });

      this.logger.info(`Profile image updated successfully for user ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating profile image', {
        error: error.message,
        stack: error.stack,
        userId,
        imageFile: imageFile?.filename
      });
      throw error;
    }
  }

  async getDashboardData(userId, date, range = 'week', month = null) {
    try {
      this.logger.info(`Fetching dashboard data for user ${userId} on date ${date} with range ${range} and month ${month}`);

      this.logger.debug('Getting user profile...');
      const user = await this.getProfile(userId);

      // Handle date string
      let dateString;
      if (date instanceof Date) {
        dateString = formatDate(date);
      } else if (typeof date === 'string') {
        const parsedDate = parseDate(date);
        if (!parsedDate) {
          throw ApiError.badRequest('Invalid date format. Please use DD-MM-YYYY');
        }
        dateString = date;
      } else {
        throw ApiError.badRequest('Invalid date format. Please use DD-MM-YYYY');
      }

      let caloriesTracker = [];
      if (range === 'month') {
        // Determine month boundaries
        let targetMonth;
        if (month) {
          targetMonth = new Date(`${month}-01T00:00:00.000Z`);
        } else {
          const parsedDate = parseDate(dateString);
          targetMonth = new Date(parsedDate);
          targetMonth.setUTCDate(1);
        }
        const year = targetMonth.getUTCFullYear();
        const monthIdx = targetMonth.getUTCMonth();
        // Get all days in month
        const daysInMonth = new Date(year, monthIdx + 1, 0).getUTCDate();
        // Find first Sunday on/after the 1st
        let firstDay = new Date(Date.UTC(year, monthIdx, 1));
        let firstSunday = new Date(firstDay);
        while (firstSunday.getUTCDay() !== 0) {
          firstSunday.setUTCDate(firstSunday.getUTCDate() + 1);
        }
        // Build week ranges (Sun-Sat)
        let weekStart = new Date(firstDay);
        let weekNum = 1;
        while (weekStart.getUTCMonth() === monthIdx) {
          let weekEnd = new Date(weekStart);
          weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
          if (weekEnd.getUTCMonth() !== monthIdx) {
            weekEnd = new Date(Date.UTC(year, monthIdx, daysInMonth));
          }

          // Convert dates to string format for query
          const weekStartString = formatDate(weekStart);
          const weekEndString = formatDate(weekEnd);

          // Query all meals in this week
          const meals = await this.prisma.userMeal.findMany({
            where: {
              userId,
              date: {
                gte: weekStartString,
                lte: weekEndString
              }
            }
          });
          const calories = meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
          caloriesTracker.push({
            label: `Week ${weekNum}`,
            start: weekStartString,
            end: weekEndString,
            calories
          });
          weekNum++;
          weekStart.setUTCDate(weekStart.getUTCDate() + 7);
        }
      } else {
        // Default: week (7 days, Sun-Sat containing 'date')
        const parsedDate = parseDate(dateString);
        const refDate = new Date(parsedDate);
        refDate.setUTCHours(0, 0, 0, 0);
        // Find Sunday of the week
        const dayOfWeek = refDate.getUTCDay();
        const sunday = new Date(refDate);
        sunday.setUTCDate(refDate.getUTCDate() - dayOfWeek);
        for (let i = 0; i < 7; i++) {
          const d = new Date(sunday);
          d.setUTCDate(sunday.getUTCDate() + i);
          const label = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayString = formatDate(d);
          const meals = await this.prisma.userMeal.findMany({
            where: {
              userId,
              date: dayString
            }
          });
          const calories = meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
          caloriesTracker.push({ label, date: dayString, calories });
        }
      }

      // Get today's meals
      this.logger.debug('Fetching today\'s meals...');
      const meals = await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: dateString
        }
      });
      this.logger.debug(`Found ${meals.length} meals`);

      // Get today's activities
      this.logger.debug('Fetching today\'s activities...');
      const activities = await this.prisma.userActivity.findMany({
        where: {
          userId,
          date: dateString
        }
      });
      this.logger.debug(`Found ${activities.length} activities`);

      // Calculate calories consumed
      this.logger.debug('Calculating calories consumed...');
      const caloriesConsumed = meals.reduce((sum, meal) => {
        return sum + (meal.totalCalories || 0);
      }, 0);
      this.logger.debug(`Total calories consumed: ${caloriesConsumed}`);

      // Calculate calories burned from activities
      this.logger.debug('Calculating calories burned from activities...');
      const caloriesBurnedFromActivities = activities.reduce((sum, activity) => {
        return sum + activity.caloriesBurned;
      }, 0);
      this.logger.debug(`Total calories burned: ${caloriesBurnedFromActivities}`);

      // Get nutrition targets
      this.logger.debug('Fetching nutrition targets...');
      const nutritionTargets = await this.prisma.dailyNutritionTarget.findFirst({
        where: {
          userId,
          isActive: true,
          effectiveDate: {
            lte: dateString
          }
        },
        orderBy: {
          effectiveDate: 'desc'
        }
      });

      // Get active weight goal
      this.logger.debug('Fetching active weight goal...');
      const weightGoal = await this.prisma.weightGoal.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      // Get latest BMI record
      this.logger.debug('Fetching latest BMI record...');
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      const dashboardData = {
        user: {
          name: user.name,
          weight: user.weight,
          height: user.height,
          bmr: user.bmr,
          tdee: user.tdee
        },
        calories: {
          consumed: caloriesConsumed,
          burnedFromActivities: caloriesBurnedFromActivities,
          bmr: user.bmr || 0,
          tdee: user.tdee || 0,
          net: caloriesConsumed - ((user.bmr || 0) + caloriesBurnedFromActivities),
          target: nutritionTargets?.calories || user.tdee || 0
        },
        activities: {
          count: activities.length,
          totalDuration: activities.reduce((sum, a) => sum + a.duration, 0),
          totalCaloriesBurned: caloriesBurnedFromActivities
        },
        weightGoal,
        latestBMI,
        date: dateString,
        caloriesTracker
      };

      this.logger.info(`Dashboard data retrieved successfully for user ${userId}`);
      return dashboardData;
    } catch (error) {
      this.logger.error('Error getting dashboard data', {
        error: error.message,
        stack: error.stack,
        userId,
        date
      });
      throw error;
    }
  }
}

module.exports = UserService;