// src/controllers/activity.controller.js
const BaseController = require('./base.controller');
const ActivityService = require('../services/activity.service');
const ApiResponse = require('../libs/http/ApiResponse');

class ActivityController extends BaseController {
  constructor() {
    super(new ActivityService(), 'Activity');
    this.activityService = new ActivityService();
  }

  async createActivity(req, res) {
    try {
      const activity = await this.activityService.createActivity({
        ...req.body,
        userId: req.user.id
      });

      this.logger.info(`User ${req.user.id} created an activity`);
      
      res.status(201).json(
        ApiResponse.created(activity, 'Activity created successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getUserActivities(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const activities = await this.activityService.getUserActivities(
        req.user.id,
        startDate,
        endDate
      );

      res.status(200).json(
        ApiResponse.success(activities, 'Activities retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async updateActivity(req, res) {
    try {
      const { activityTypeId } = req.params;
      
      const activity = await this.activityService.updateActivity(
        req.user.id,
        activityTypeId,
        req.body
      );

      res.status(200).json(
        ApiResponse.updated(activity, 'Activity updated successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteActivity(req, res) {
    try {
      const { activityTypeId } = req.params;
      
      await this.activityService.deleteActivity(req.user.id, activityTypeId);

      res.status(200).json(
        ApiResponse.deleted('Activity deleted successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getDailySummary(req, res) {
    try {
      const { date } = req.query;
      
      const summary = await this.activityService.getDailySummary(
        req.user.id,
        date
      );

      res.status(200).json(
        ApiResponse.success(summary, 'Daily activity summary retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }

  async getActivityTypes(req, res) {
    try {
      const { category } = req.query;
      
      const activityTypes = await this.activityService.getActivityTypes(category);

      res.status(200).json(
        ApiResponse.success(activityTypes, 'Activity types retrieved successfully')
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ActivityController;