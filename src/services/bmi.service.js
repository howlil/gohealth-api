// src/services/bmi.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');

class BMIService extends BaseService {
  constructor() {
    super('bMIRecord');
    this.calorieUtil = new CalorieUtil();
  }

  async calculateAndSaveBMI(userId, weight, height) {
    try {
      // Calculate BMI
      const bmi = this.calorieUtil.calculateBMI(weight, height);
      const status = this.calorieUtil.getBMIStatus(bmi);

      // Save BMI record
      const bmiRecord = await this.prisma.bMIRecord.create({
        data: {
          userId,
          height,
          weight,
          bmi,
          status
        }
      });

      // Update user's current weight and height
      await this.prisma.user.update({
        where: { id: userId },
        data: { height, weight }
      });

      this.logger.info(`BMI calculated for user ${userId}: ${bmi} (${status})`);

      return bmiRecord;
    } catch (error) {
      this.logger.error(`Error calculating BMI: ${error.message}`);
      throw error;
    }
  }

  async getBMIHistory(userId, limit = 10) {
    try {
      return await this.prisma.bMIRecord.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: limit
      });
    } catch (error) {
      this.logger.error(`Error getting BMI history: ${error.message}`);
      throw error;
    }
  }

  async getLatestBMI(userId) {
    try {
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      if (!latestBMI) {
        throw ApiError.notFound('No BMI records found');
      }

      return latestBMI;
    } catch (error) {
      this.logger.error(`Error getting latest BMI: ${error.message}`);
      throw error;
    }
  }

  async getBMIAnalysis(userId) {
    try {
      const records = await this.prisma.bMIRecord.findMany({
        where: { userId },
        orderBy: { recordedAt: 'asc' },
        take: 30 // Last 30 records
      });

      if (records.length === 0) {
        throw ApiError.notFound('No BMI records found');
      }

      const latest = records[records.length - 1];
      const oldest = records[0];
      const change = latest.bmi - oldest.bmi;
      const trend = change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';

      // Calculate average BMI
      const averageBMI = records.reduce((sum, record) => sum + record.bmi, 0) / records.length;

      return {
        latest: latest,
        trend: {
          direction: trend,
          change: Math.abs(change),
          percentage: Math.abs((change / oldest.bmi) * 100)
        },
        average: averageBMI,
        history: records
      };
    } catch (error) {
      this.logger.error(`Error getting BMI analysis: ${error.message}`);
      throw error;
    }
  }

  async createWeightGoal(userId, data) {
    try {
      const { startWeight, targetWeight, startDate, targetDate } = data;

      // Deactivate existing active goals
      await this.prisma.weightGoal.updateMany({
        where: {
          userId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      // Create new weight goal
      const weightGoal = await this.prisma.weightGoal.create({
        data: {
          userId,
          startWeight,
          targetWeight,
          startDate: new Date(startDate),
          targetDate: targetDate ? new Date(targetDate) : null,
          isActive: true
        }
      });

      this.logger.info(`Weight goal created for user ${userId}`);

      return weightGoal;
    } catch (error) {
      this.logger.error(`Error creating weight goal: ${error.message}`);
      throw error;
    }
  }

  async getActiveWeightGoal(userId) {
    try {
      const goal = await this.prisma.weightGoal.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      if (!goal) {
        return null;
      }

      // Get current weight from latest BMI record
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      const currentWeight = latestBMI ? latestBMI.weight : goal.startWeight;
      const progress = ((goal.startWeight - currentWeight) / (goal.startWeight - goal.targetWeight)) * 100;

      return {
        ...goal,
        currentWeight,
        progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
        weightLost: goal.startWeight - currentWeight,
        weightRemaining: currentWeight - goal.targetWeight
      };
    } catch (error) {
      this.logger.error(`Error getting active weight goal: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BMIService;