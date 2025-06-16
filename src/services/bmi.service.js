// src/services/bmi.service.js
const BaseService = require('./base.service');
const ApiError = require('../libs/http/ApiError');
const CalorieUtil = require('../libs/utils/calorie.util');
const { parseDate } = require('../libs/utils/date');

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

  async getLatestBMI(userId) {
    try {
      this.logger.info(`Fetching latest BMI for user ${userId}`);

      this.logger.debug('Querying latest BMI record from database...');
      const latestBMI = await this.prisma.bMIRecord.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' }
      });

      if (!latestBMI) {
        this.logger.warn(`No BMI records found for user ${userId}`);
        throw ApiError.notFound('No BMI records found');
      }

      this.logger.info(`Latest BMI retrieved successfully for user ${userId}`);
      return latestBMI;
    } catch (error) {
      this.logger.error('Error getting latest BMI', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  async getBMIAnalysis(userId) {
    try {
      this.logger.info(`Fetching BMI analysis for user ${userId}`);

      this.logger.debug('Querying BMI records for analysis...');
      const records = await this.prisma.bMIRecord.findMany({
        where: { userId },
        orderBy: { recordedAt: 'asc' },
        take: 30 // Last 30 records
      });

      if (records.length === 0) {
        this.logger.warn(`No BMI records found for analysis for user ${userId}`);
        throw ApiError.notFound('No BMI records found');
      }

      this.logger.debug(`Found ${records.length} records for analysis`);

      const latest = records[records.length - 1];
      const oldest = records[0];
      const change = latest.bmi - oldest.bmi;
      const trend = change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';

      // Calculate average BMI
      const averageBMI = records.reduce((sum, record) => sum + record.bmi, 0) / records.length;

      this.logger.debug(`Analysis results - Trend: ${trend}, Change: ${change}, Average BMI: ${averageBMI}`);

      const analysis = {
        latest: latest,
        trend: {
          direction: trend,
          change: Math.abs(change),
          percentage: Math.abs((change / oldest.bmi) * 100)
        },
        average: averageBMI,
        history: records
      };

      this.logger.info(`BMI analysis completed successfully for user ${userId}`);
      return analysis;
    } catch (error) {
      this.logger.error('Error getting BMI analysis', {
        error: error.message,
        stack: error.stack,
        userId
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
      const parsedStartDate = new Date();
      const parsedTargetDate = parseDate(targetDate);

      if (!parsedTargetDate) {
        throw ApiError.badRequest('Invalid target date format. Use DD-MM-YYYY');
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
          startDate: parsedStartDate,
          targetDate: parsedTargetDate,
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
}

module.exports = BMIService;