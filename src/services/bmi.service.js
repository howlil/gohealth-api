// src/services/bmi.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');
const { parseDate, formatDate } = require('../libs/utils/date');

class BMIService extends BaseService {
  constructor() {
    super('bMIRecord');
    this.calorieUtil = new CalorieUtil();
  }

  async calculateAndSaveBMI(userId, weight, height) {
    try {
      this.logger.info(`Calculating BMI for user ${userId} with weight ${weight}kg and height ${height}cm`);

      // Ambil profil user
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw ApiError.notFound('User not found');
      if (!user.age || !user.gender || !user.activityLevel) throw ApiError.badRequest('User profile incomplete (age, gender, activity level required)');

      // Calculate BMI
      this.logger.debug('Calculating BMI value...');
      const bmi = this.calorieUtil.calculateBMI(weight, height);
      const status = this.calorieUtil.getBMIStatus(bmi);
      this.logger.debug(`Calculated BMI: ${bmi}, Status: ${status}`);

      // Hitung BMR & TDEE
      const bmr = this.calorieUtil.calculateBMR(weight, height, user.age, user.gender);
      const tdee = this.calorieUtil.calculateTDEE(bmr, user.activityLevel);

      // Hitung ringkasan gizi
      const caloriesMin = Math.round(tdee * 0.9);
      const caloriesMax = Math.round(tdee * 1.1);
      const proteinMin = Math.round((caloriesMin * 0.15) / 4);
      const proteinMax = Math.round((caloriesMax * 0.20) / 4);
      const carbMin = Math.round((caloriesMin * 0.50) / 4);
      const carbMax = Math.round((caloriesMax * 0.60) / 4);
      const fatMin = Math.round((caloriesMin * 0.20) / 9);
      const fatMax = Math.round((caloriesMax * 0.30) / 9);
      const nutritionSummary = {
        calories: { min: caloriesMin, max: caloriesMax },
        protein: { min: proteinMin, max: proteinMax, unit: 'gram' },
        carbohydrate: { min: carbMin, max: carbMax, unit: 'gram' },
        fat: { min: fatMin, max: fatMax, unit: 'gram' }
      };

      // Save BMI record
      this.logger.debug('Saving BMI record to database...');
      const bmiRecord = await this.prisma.bMIRecord.create({
        data: {
          userId,
          height,
          weight,
          bmi,
          status,
          nutritionSummary
        }
      });

      // Update user's current weight and height
      this.logger.debug('Updating user\'s current weight and height...');
      await this.prisma.user.update({
        where: { id: userId },
        data: { height, weight }
      });

      this.logger.info(`BMI calculated and saved successfully for user ${userId}`);

      const schema = {
        id: bmiRecord.id,
        height: bmiRecord.height,
        weight: bmiRecord.weight,
        bmi: bmiRecord.bmi,
        status: bmiRecord.status,
        recordedAt: bmiRecord.recordedAt,
        nutritionSummary: bmiRecord.nutritionSummary
      };

      return schema;
    } catch (error) {
      this.logger.error('Error calculating BMI', {
        error: error.message,
        stack: error.stack,
        userId,
        weight,
        height
      });
      throw error;
    }
  }

  async getBMIHistory(userId, limit = 10) {
    try {
      this.logger.info(`Fetching BMI history for user ${userId} with limit ${limit}`);

      this.logger.debug('Querying BMI records from database...');
      const bmiRecords = await this.prisma.bMIRecord.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: limit
      });

      this.logger.debug(`Found ${bmiRecords.length} BMI records`);

      const schema = bmiRecords.map(record => ({
        id: record.id,
        height: record.height,
        weight: record.weight,
        bmi: record.bmi,
        status: record.status,
        recordedAt: record.recordedAt,
        nutritionSummary: record.nutritionSummary
      }));

      this.logger.info(`BMI history retrieved successfully for user ${userId}`);
      return schema;
    } catch (error) {
      this.logger.error('Error getting BMI history', {
        error: error.message,
        stack: error.stack,
        userId,
        limit
      });
      throw error;
    }
  }

  async updateBMI(userId, bmiId, height, weight) {
    try {
      this.logger.info(`Updating BMI for user ${userId}, record ID: ${bmiId}`);

      // Check if BMI record exists and belongs to user
      const existingRecord = await this.prisma.bMIRecord.findUnique({
        where: { id: bmiId }
      });

      if (!existingRecord) {
        throw ApiError.notFound('BMI record not found');
      }

      if (existingRecord.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this BMI record');
      }

      // Calculate new BMI
      this.logger.debug('Calculating new BMI value...');
      const bmi = this.calorieUtil.calculateBMI(weight, height);
      const status = this.calorieUtil.getBMIStatus(bmi);
      this.logger.debug(`Calculated new BMI: ${bmi}, Status: ${status}`);

      // Get user for nutrition calculations
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw ApiError.notFound('User not found');

      // Recalculate nutrition summary
      const bmr = this.calorieUtil.calculateBMR(weight, height, user.age, user.gender);
      const tdee = this.calorieUtil.calculateTDEE(bmr, user.activityLevel);

      const caloriesMin = Math.round(tdee * 0.9);
      const caloriesMax = Math.round(tdee * 1.1);
      const proteinMin = Math.round((caloriesMin * 0.15) / 4);
      const proteinMax = Math.round((caloriesMax * 0.20) / 4);
      const carbMin = Math.round((caloriesMin * 0.50) / 4);
      const carbMax = Math.round((caloriesMax * 0.60) / 4);
      const fatMin = Math.round((caloriesMin * 0.20) / 9);
      const fatMax = Math.round((caloriesMax * 0.30) / 9);
      const nutritionSummary = {
        calories: { min: caloriesMin, max: caloriesMax },
        protein: { min: proteinMin, max: proteinMax, unit: 'gram' },
        carbohydrate: { min: carbMin, max: carbMax, unit: 'gram' },
        fat: { min: fatMin, max: fatMax, unit: 'gram' }
      };

      // Update BMI record
      this.logger.debug('Updating BMI record in database...');
      const updatedBMI = await this.prisma.bMIRecord.update({
        where: { id: bmiId },
        data: {
          height,
          weight,
          bmi,
          status,
          nutritionSummary
        }
      });

      // Update user's current weight and height if this is the most recent record
      const latestRecord = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      if (latestRecord && latestRecord.id === bmiId) {
        this.logger.debug('Updating user\'s current weight and height...');
        await this.prisma.user.update({
          where: { id: userId },
          data: { height, weight }
        });
      }

      this.logger.info(`BMI updated successfully for user ${userId}, record ID: ${bmiId}`);

      return {
        id: updatedBMI.id,
        height: updatedBMI.height,
        weight: updatedBMI.weight,
        bmi: updatedBMI.bmi,
        status: updatedBMI.status,
        recordedAt: updatedBMI.recordedAt,
        nutritionSummary: updatedBMI.nutritionSummary
      };
    } catch (error) {
      this.logger.error('Error updating BMI', {
        error: error.message,
        stack: error.stack,
        userId,
        bmiId,
        height,
        weight
      });
      throw error;
    }
  }

  async deleteBMI(userId, bmiId) {
    try {
      this.logger.info(`Deleting BMI record ${bmiId} for user ${userId}`);

      // Check if BMI record exists and belongs to user
      const existingRecord = await this.prisma.bMIRecord.findUnique({
        where: { id: bmiId }
      });

      if (!existingRecord) {
        throw ApiError.notFound('BMI record not found');
      }

      if (existingRecord.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to delete this BMI record');
      }

      // Delete BMI record
      await this.prisma.bMIRecord.delete({
        where: { id: bmiId }
      });

      // If this was the latest record, update user with the values from the new latest record
      const latestRecord = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      if (latestRecord) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            height: latestRecord.height,
            weight: latestRecord.weight
          }
        });
      }

      this.logger.info(`BMI record ${bmiId} deleted successfully for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting BMI record', {
        error: error.message,
        stack: error.stack,
        userId,
        bmiId
      });
      throw error;
    }
  }

  async createWeightGoal(userId, data) {
    try {
      this.logger.info(`Creating weight goal for user ${userId}`);

      const { targetWeight, targetDate } = data;
      this.logger.debug('Weight goal parameters:', { targetWeight, targetDate });

      // Get current weight from latest BMI record
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      if (!latestBMI) {
        throw ApiError.badRequest('No BMI record found. Please calculate your BMI first.');
      }

      const startWeight = latestBMI.weight;
      const startDateString = formatDate(new Date()); // Today as DD-MM-YYYY

      // Handle target date
      let targetDateString;
      if (targetDate) {
        if (targetDate instanceof Date) {
          targetDateString = formatDate(targetDate);
        } else if (typeof targetDate === 'string') {
          const parsedTargetDate = parseDate(targetDate);
          if (!parsedTargetDate) {
            throw ApiError.badRequest('Invalid target date format. Use DD-MM-YYYY');
          }
          targetDateString = targetDate;
        } else {
          throw ApiError.badRequest('Invalid target date format. Use DD-MM-YYYY');
        }
      }

      // Deactivate existing active goals
      this.logger.debug('Deactivating existing active goals...');
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
      this.logger.debug('Creating new weight goal...');
      const weightGoal = await this.prisma.weightGoal.create({
        data: {
          userId,
          startWeight,
          targetWeight,
          startDate: startDateString,
          targetDate: targetDateString,
          isActive: true
        }
      });

      this.logger.info(`Weight goal created successfully for user ${userId}`);
      return weightGoal;
    } catch (error) {
      this.logger.error('Error creating weight goal', {
        error: error.message,
        stack: error.stack,
        userId,
        goalData: data
      });
      throw error;
    }
  }

  async getActiveWeightGoal(userId) {
    try {
      this.logger.info(`Fetching active weight goal for user ${userId}`);

      this.logger.debug('Querying active weight goal...');
      const goal = await this.prisma.weightGoal.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      if (!goal) {
        this.logger.debug(`No active weight goal found for user ${userId}`);
        return null;
      }

      // Get current weight from latest BMI record
      this.logger.debug('Getting current weight from latest BMI record...');
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      const currentWeight = latestBMI ? latestBMI.weight : goal.startWeight;
      const progress = ((goal.startWeight - currentWeight) / (goal.startWeight - goal.targetWeight)) * 100;

      this.logger.debug(`Goal progress - Current weight: ${currentWeight}, Progress: ${progress}%`);

      const goalData = {
        ...goal,
        currentWeight,
        progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
        weightLost: goal.startWeight - currentWeight,
        weightRemaining: currentWeight - goal.targetWeight
      };

      this.logger.info(`Active weight goal retrieved successfully for user ${userId}`);
      return goalData;
    } catch (error) {
      this.logger.error('Error getting active weight goal', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  async updateWeightGoal(userId, goalId, data) {
    try {
      this.logger.info(`Updating weight goal ${goalId} for user ${userId}`);

      // Check if goal exists and belongs to user
      const existingGoal = await this.prisma.weightGoal.findUnique({
        where: { id: goalId }
      });

      if (!existingGoal) {
        throw ApiError.notFound('Weight goal not found');
      }

      if (existingGoal.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this weight goal');
      }

      const { targetWeight, targetDate } = data;
      const updateData = {};

      if (targetWeight) {
        updateData.targetWeight = targetWeight;
      }

      if (targetDate) {
        let targetDateString;
        if (targetDate instanceof Date) {
          targetDateString = formatDate(targetDate);
        } else if (typeof targetDate === 'string') {
          const parsedTargetDate = parseDate(targetDate);
          if (!parsedTargetDate) {
            throw ApiError.badRequest('Invalid target date format. Use DD-MM-YYYY');
          }
          targetDateString = targetDate;
        } else {
          throw ApiError.badRequest('Invalid target date format. Use DD-MM-YYYY');
        }
        updateData.targetDate = targetDateString;
      }

      // Update weight goal
      this.logger.debug('Updating weight goal in database...');
      const updatedGoal = await this.prisma.weightGoal.update({
        where: { id: goalId },
        data: updateData
      });

      this.logger.info(`Weight goal ${goalId} updated successfully for user ${userId}`);

      // Get current weight from latest BMI record for progress calculation
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      const currentWeight = latestBMI ? latestBMI.weight : updatedGoal.startWeight;
      const progress = ((updatedGoal.startWeight - currentWeight) / (updatedGoal.startWeight - updatedGoal.targetWeight)) * 100;

      return {
        ...updatedGoal,
        currentWeight,
        progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
        weightLost: updatedGoal.startWeight - currentWeight,
        weightRemaining: currentWeight - updatedGoal.targetWeight
      };
    } catch (error) {
      this.logger.error('Error updating weight goal', {
        error: error.message,
        stack: error.stack,
        userId,
        goalId,
        data
      });
      throw error;
    }
  }

  async deleteWeightGoal(userId, goalId) {
    try {
      this.logger.info(`Deleting weight goal ${goalId} for user ${userId}`);

      // Check if goal exists and belongs to user
      const existingGoal = await this.prisma.weightGoal.findUnique({
        where: { id: goalId }
      });

      if (!existingGoal) {
        throw ApiError.notFound('Weight goal not found');
      }

      if (existingGoal.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to delete this weight goal');
      }

      // Delete weight goal
      await this.prisma.weightGoal.delete({
        where: { id: goalId }
      });

      this.logger.info(`Weight goal ${goalId} deleted successfully for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting weight goal', {
        error: error.message,
        stack: error.stack,
        userId,
        goalId
      });
      throw error;
    }
  }
}

module.exports = BMIService;