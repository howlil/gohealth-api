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

  async updateBMI(req, res) {
    try {
      const { bmiId } = req.params;
      const { height, weight } = req.body;

      const updatedBMI = await this.bmiService.updateBMI(
        req.user.id,
        bmiId,
        height,
        weight
      );

      this.logger.info(`BMI updated for user ${req.user.id}, record ID: ${bmiId}`);

      res.status(200).json(
        ApiResponse.success(updatedBMI, 'BMI updated successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteBMI(req, res) {
    try {
      const { bmiId } = req.params;

      await this.bmiService.deleteBMI(req.user.id, bmiId);

      this.logger.info(`BMI deleted for user ${req.user.id}, record ID: ${bmiId}`);

      res.status(200).json(
        ApiResponse.success(null, 'BMI deleted successfully')
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

  async updateWeightGoal(req, res) {
    try {
      const { goalId } = req.params;
      const updatedGoal = await this.bmiService.updateWeightGoal(
        req.user.id,
        goalId,
        req.body
      );

      this.logger.info(`Weight goal updated for user ${req.user.id}, goal ID: ${goalId}`);

      res.status(200).json(
        ApiResponse.success(updatedGoal, 'Weight goal updated successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteWeightGoal(req, res) {
    try {
      const { goalId } = req.params;
      await this.bmiService.deleteWeightGoal(req.user.id, goalId);

      this.logger.info(`Weight goal deleted for user ${req.user.id}, goal ID: ${goalId}`);

      res.status(200).json(
        ApiResponse.success(null, 'Weight goal deleted successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BMIController;