// src/services/activity.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');

class ActivityService extends BaseService {
  constructor() {
    super('userActivity');
    this.calorieUtil = new CalorieUtil();
  }

  async createActivity(data) {
    try {
      const { userId, activityTypeId, duration, ...activityData } = data;

      // Get user weight
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user.weight) {
        throw ApiError.badRequest('User weight is required to calculate calories burned');
      }

      // Get activity type
      const activityType = await this.prisma.activityType.findUnique({
        where: { id: activityTypeId }
      });

      if (!activityType) {
        throw ApiError.notFound('Activity type not found');
      }

      // Calculate calories burned
      const caloriesBurned = this.calorieUtil.calculateActivityCalories(
        activityType.metValue,
        user.weight,
        duration
      );

      // Create activity
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activityTypeId,
          duration,
          caloriesBurned,
          ...activityData
        },
        include: {
          activityType: true
        }
      });
    } catch (error) {
      this.logger.error(`Error creating activity: ${error.message}`);
      throw error;
    }
  }

  async getUserActivities(userId, startDate, endDate) {
    try {
      return await this.prisma.userActivity.findMany({
        where: {
          userId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          activityType: true
        },
        orderBy: [
          { date: 'desc' },
          { startTime: 'desc' }
        ]
      });
    } catch (error) {
      this.logger.error(`Error getting user activities: ${error.message}`);
      throw error;
    }
  }

  async updateActivity(userId, activityTypeId, data) {
    try {
      const existingActivity = await this.prisma.userActivity.findUnique({
        where: { 
          userId_activityTypeId: {
            userId,
            activityTypeId
          }
        },
        include: { activityType: true }
      });

      if (!existingActivity) {
        throw ApiError.notFound('Activity not found');
      }

      let caloriesBurned = existingActivity.caloriesBurned;

      // Recalculate calories if duration changed
      if (data.duration && data.duration !== existingActivity.duration) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId }
        });

        caloriesBurned = this.calorieUtil.calculateActivityCalories(
          existingActivity.activityType.metValue,
          user.weight,
          data.duration
        );
      }

      return await this.prisma.userActivity.update({
        where: { 
          userId_activityTypeId: {
            userId,
            activityTypeId
          }
        },
        data: {
          ...data,
          caloriesBurned
        },
        include: {
          activityType: true
        }
      });
    } catch (error) {
      this.logger.error(`Error updating activity: ${error.message}`);
      throw error;
    }
  }

  async deleteActivity(userId, activityTypeId) {
    try {
      const activity = await this.prisma.userActivity.findUnique({
        where: { 
          userId_activityTypeId: {
            userId,
            activityTypeId
          }
        }
      });

      if (!activity) {
        throw ApiError.notFound('Activity not found');
      }

      await this.prisma.userActivity.delete({
        where: { 
          userId_activityTypeId: {
            userId,
            activityTypeId
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting activity: ${error.message}`);
      throw error;
    }
  }

  async getDailySummary(userId, date) {
    try {
      const activities = await this.prisma.userActivity.findMany({
        where: {
          userId,
          date: new Date(date)
        },
        include: {
          activityType: true
        }
      });

      const summary = activities.reduce((acc, activity) => {
        acc.totalDuration += activity.duration;
        acc.totalCaloriesBurned += activity.caloriesBurned;
        acc.activityCount += 1;

        if (!acc.byCategory[activity.activityType.category]) {
          acc.byCategory[activity.activityType.category] = {
            duration: 0,
            caloriesBurned: 0,
            count: 0
          };
        }

        acc.byCategory[activity.activityType.category].duration += activity.duration;
        acc.byCategory[activity.activityType.category].caloriesBurned += activity.caloriesBurned;
        acc.byCategory[activity.activityType.category].count += 1;

        return acc;
      }, {
        totalDuration: 0,
        totalCaloriesBurned: 0,
        activityCount: 0,
        byCategory: {}
      });

      return {
        summary,
        activities
      };
    } catch (error) {
      this.logger.error(`Error getting activity daily summary: ${error.message}`);
      throw error;
    }
  }

  async getActivityTypes(category = null) {
    try {
      const where = category ? { category } : {};
      
      return await this.prisma.activityType.findMany({
        where,
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      this.logger.error(`Error getting activity types: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ActivityService;