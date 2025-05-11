// src/controllers/bmi.controller.js
const BaseController = require('./base.controller');
const BMIService = require('../services/bmi.service');
const ApiResponse = require('../libs/http/ApiResponse');
const ApiError = require('../libs/http/ApiError');

class BMIController extends BaseController {
  constructor() {
    super(new BMIService(), 'BMI');
    this.bmiService = new BMIService();
  }

  async calculateBMI(req, res) {
    try {
      const { height, weight } = req.body;

      if (!height || !weight) {
        throw ApiError.badRequest('Height and weight are required');
      }

      const bmiRecord = await this.bmiService.calculateAndSaveBMI(
        req.user.id,
        weight,
        height
      );

      this.logger.info(`BMI calculated for user ${req.user.id}`);
      
      res.status(201).json(
        ApiResponse.created(bmiRecord, 'BMI calculated successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getBMIHistory(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const history = await this.bmiService.getBMIHistory(
        req.user.id,
        parseInt(limit)
      );

      res.status(200).json(
        ApiResponse.success(history, 'BMI history retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getLatestBMI(req, res) {
    try {
      const latestBMI = await this.bmiService.getLatestBMI(req.user.id);

      res.status(200).json(
        ApiResponse.success(latestBMI, 'Latest BMI retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getBMIAnalysis(req, res) {
    try {
      const analysis = await this.bmiService.getBMIAnalysis(req.user.id);

      res.status(200).json(
        ApiResponse.success(analysis, 'BMI analysis retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async createWeightGoal(req, res) {
    try {
      const weightGoal = await this.bmiService.createWeightGoal(
        req.user.id,
        req.body
      );

      this.logger.info(`Weight goal created for user ${req.user.id}`);
      
      res.status(201).json(
        ApiResponse.created(weightGoal, 'Weight goal created successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getActiveWeightGoal(req, res) {
    try {
      const goal = await this.bmiService.getActiveWeightGoal(req.user.id);

      if (!goal) {
        return res.status(200).json(
          ApiResponse.success(null, 'No active weight goal found')
        );
      }

      res.status(200).json(
        ApiResponse.success(goal, 'Active weight goal retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BMIController;