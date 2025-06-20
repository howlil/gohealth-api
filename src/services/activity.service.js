// src/services/activity.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');
const { parseDate, formatDate } = require('../libs/utils/date');

class ActivityService extends BaseService {
  constructor() {
    super('userActivity');
    this.calorieUtil = new CalorieUtil();
  }

  async createActivity(data) {
    try {
      this.logger.info(`Creating activity for user ${data.userId}`);

      const { userId, activityTypeId, duration, ...activityData } = data;
      this.logger.debug('Activity data:', { activityTypeId, duration, ...activityData });

      // Get user weight
      this.logger.debug('Getting user weight...');
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user.weight) {
        this.logger.warn(`User ${userId} has no weight set`);
        throw ApiError.badRequest('User weight is required to calculate calories burned');
      }

      // Get activity type
      this.logger.debug('Getting activity type...');
      const activityType = await this.prisma.activityType.findUnique({
        where: { id: activityTypeId }
      });

      if (!activityType) {
        this.logger.warn(`Activity type not found: ${activityTypeId}`);
        throw ApiError.notFound('Activity type not found');
      }

      // Calculate calories burned
      this.logger.debug('Calculating calories burned...');
      const caloriesBurned = this.calorieUtil.calculateActivityCalories(
        activityType.metValue,
        user.weight,
        duration
      );
      this.logger.debug(`Calculated calories burned: ${caloriesBurned}`);

      // Create activity
      this.logger.debug('Creating activity record...');
      const activity = await this.prisma.userActivity.create({
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

      this.logger.info(`Activity created successfully for user ${userId}`);
      return activity;
    } catch (error) {
      this.logger.error('Error creating activity', {
        error: error.message,
        stack: error.stack,
        userId: data.userId,
        activityData: data
      });
      throw error;
    }
  }

  async getUserActivities(userId, startDate, endDate) {
    try {
      this.logger.info(`Fetching activities for user ${userId} from ${startDate} to ${endDate}`);

      // Dates are now stored as strings in DD-MM-YYYY format
      let startDateString, endDateString;

      // Handle startDate
      if (startDate instanceof Date) {
        startDateString = formatDate(startDate);
      } else if (typeof startDate === 'string') {
        const parsedStartDate = parseDate(startDate);
        if (!parsedStartDate) {
          throw ApiError.badRequest('Invalid start date format. Please use DD-MM-YYYY');
        }
        startDateString = startDate;
      } else {
        throw ApiError.badRequest('Invalid start date format. Please use DD-MM-YYYY');
      }

      // Handle endDate
      if (endDate instanceof Date) {
        endDateString = formatDate(endDate);
      } else if (typeof endDate === 'string') {
        const parsedEndDate = parseDate(endDate);
        if (!parsedEndDate) {
          throw ApiError.badRequest('Invalid end date format. Please use DD-MM-YYYY');
        }
        endDateString = endDate;
      } else {
        throw ApiError.badRequest('Invalid end date format. Please use DD-MM-YYYY');
      }

      this.logger.debug('Querying activities from database...');
      const activities = await this.prisma.userActivity.findMany({
        where: {
          userId,
          date: {
            gte: startDateString,
            lte: endDateString
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

      this.logger.debug(`Found ${activities.length} activities`);
      this.logger.info(`Activities retrieved successfully for user ${userId}`);
      return activities;
    } catch (error) {
      this.logger.error('Error getting user activities', {
        error: error.message,
        stack: error.stack,
        userId,
        startDate,
        endDate
      });
      throw error;
    }
  }

  async updateActivity(userId, activityTypeId, data) {
    try {
      this.logger.info(`Updating activity for user ${userId}, activity type ${activityTypeId}`);

      this.logger.debug('Finding existing activity...');
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
        this.logger.warn(`Activity not found for user ${userId}, activity type ${activityTypeId}`);
        throw ApiError.notFound('Activity not found');
      }

      let caloriesBurned = existingActivity.caloriesBurned;

      // Recalculate calories if duration changed
      if (data.duration && data.duration !== existingActivity.duration) {
        this.logger.debug('Recalculating calories burned...');
        const user = await this.prisma.user.findUnique({
          where: { id: userId }
        });

        caloriesBurned = this.calorieUtil.calculateActivityCalories(
          existingActivity.activityType.metValue,
          user.weight,
          data.duration
        );
        this.logger.debug(`Recalculated calories burned: ${caloriesBurned}`);
      }

      this.logger.debug('Updating activity record...');
      const updatedActivity = await this.prisma.userActivity.update({
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

      this.logger.info(`Activity updated successfully for user ${userId}`);
      return updatedActivity;
    } catch (error) {
      this.logger.error('Error updating activity', {
        error: error.message,
        stack: error.stack,
        userId,
        activityTypeId,
        updateData: data
      });
      throw error;
    }
  }

  async deleteActivity(userId, activityTypeId) {
    try {
      this.logger.info(`Deleting activity for user ${userId}, activity type ${activityTypeId}`);

      this.logger.debug('Finding activity to delete...');
      const activity = await this.prisma.userActivity.findUnique({
        where: {
          userId_activityTypeId: {
            userId,
            activityTypeId
          }
        }
      });

      if (!activity) {
        this.logger.warn(`Activity not found for user ${userId}, activity type ${activityTypeId}`);
        throw ApiError.notFound('Activity not found');
      }

      this.logger.debug('Deleting activity record...');
      await this.prisma.userActivity.delete({
        where: {
          userId_activityTypeId: {
            userId,
            activityTypeId
          }
        }
      });

      this.logger.info(`Activity deleted successfully for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting activity', {
        error: error.message,
        stack: error.stack,
        userId,
        activityTypeId
      });
      throw error;
    }
  }

  async getDailySummary(userId, date) {
    try {
      this.logger.info(`Fetching daily activity summary for user ${userId} on ${date}`);

      // Date is now stored as string in DD-MM-YYYY format
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

      this.logger.debug('Querying activities for the day...');
      const activities = await this.prisma.userActivity.findMany({
        where: {
          userId,
          date: dateString
        },
        include: {
          activityType: true
        }
      });

      this.logger.debug(`Found ${activities.length} activities`);

      this.logger.debug('Calculating activity summary...');
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

      this.logger.debug('Activity summary:', summary);

      const result = {
        summary,
        activities
      };

      this.logger.info(`Daily activity summary retrieved successfully for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error('Error getting activity daily summary', {
        error: error.message,
        stack: error.stack,
        userId,
        date
      });
      throw error;
    }
  }

  async getActivityTypes(category = null) {
    try {
      this.logger.info(`Fetching activity types${category ? ` for category: ${category}` : ''}`);

      const where = category ? { category } : {};
      this.logger.debug('Query parameters:', { where });

      const activityTypes = await this.prisma.activityType.findMany({
        where,
        orderBy: { name: 'asc' }
      });

      this.logger.debug(`Found ${activityTypes.length} activity types`);
      this.logger.info('Activity types retrieved successfully');
      return activityTypes;
    } catch (error) {
      this.logger.error('Error getting activity types', {
        error: error.message,
        stack: error.stack,
        category
      });
      throw error;
    }
  }
}

module.exports = ActivityService;