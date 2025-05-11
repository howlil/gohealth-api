// src/services/user.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');

class UserService extends BaseService {
  constructor() {
    super('user');
    this.calorieUtil = new CalorieUtil();
  }

  async getProfile(userId) {
    try {
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
        throw ApiError.notFound('User not found');
      }

      // Add calculated fields
      if (user.weight && user.height && user.age && user.gender) {
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
      }

      return user;
    } catch (error) {
      this.logger.error(`Error getting user profile: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(userId, data) {
    try {
      // Validate allowed fields for update
      const allowedFields = ['name', 'age', 'gender', 'height', 'weight', 'activityLevel'];
      const updateData = Object.keys(data)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return this.getProfile(userId);
    } catch (error) {
      this.logger.error(`Error updating user profile: ${error.message}`);
      throw error;
    }
  }

  async updateProfileImage(userId, imageFile) {
    try {
      // Here you would typically:
      // 1. Upload to cloud storage (S3, Cloudinary, etc.)
      // 2. Get the URL
      // 3. Update user record with the URL
      
      // For now, we'll just update with a placeholder
      const imageUrl = `/uploads/profile/${userId}/${imageFile.filename}`;

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl }
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating profile image: ${error.message}`);
      throw error;
    }
  }

  async getDashboardData(userId, date) {
    try {
      const user = await this.getProfile(userId);
      
      // Get today's meals
      const meals = await this.prisma.userMeal.findMany({
        where: {
          userId,
          date: new Date(date)
        }
      });

      // Get today's activities
      const activities = await this.prisma.userActivity.findMany({
        where: {
          userId,
          date: new Date(date)
        }
      });

      // Calculate calories consumed
      const caloriesConsumed = meals.reduce((sum, meal) => {
        return sum + (meal.nutritionData?.calories || 0);
      }, 0);

      // Calculate calories burned from activities
      const caloriesBurnedFromActivities = activities.reduce((sum, activity) => {
        return sum + activity.caloriesBurned;
      }, 0);

      // Get nutrition targets
      const nutritionTargets = await this.prisma.dailyNutritionTarget.findFirst({
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

      // Get active weight goal
      const weightGoal = await this.prisma.weightGoal.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      // Get latest BMI record
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      return {
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
        date
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = UserService;