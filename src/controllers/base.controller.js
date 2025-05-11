const ApiResponse = require('../libs/http/ApiResponse');
const Logger = require('../libs/logger/Logger');

class BaseController {
  constructor(service, entityName) {
    this.service = service;
    this.entityName = entityName;
    this.logger = Logger;
  }

  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await this.service.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        filters,
        userId: req.user?.id
      });

      this.logger.info(`Fetched ${result.data.length} ${this.entityName}s`);
      
      res.status(200).json(
        ApiResponse.pagination(
          result.data,
          page,
          limit,
          result.total,
          `${this.entityName}s retrieved successfully`
        )
      );
    } catch (error) {
      throw error;
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await this.service.findById(id, req.user?.id);

      if (!data) {
        return res.status(404).json(
          ApiResponse.error(`${this.entityName} not found`, 404)
        );
      }

      this.logger.info(`Fetched ${this.entityName} with id: ${id}`);
      
      res.status(200).json(
        ApiResponse.success(data, `${this.entityName} retrieved successfully`)
      );
    } catch (error) {
      throw error;
    }
  }

  async create(req, res) {
    try {
      const data = await this.service.create({
        ...req.body,
        userId: req.user?.id
      });

      this.logger.info(`Created new ${this.entityName}`);
      
      res.status(201).json(
        ApiResponse.created(data, `${this.entityName} created successfully`)
      );
    } catch (error) {
      throw error;
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await this.service.update(id, req.body, req.user?.id);

      if (!data) {
        return res.status(404).json(
          ApiResponse.error(`${this.entityName} not found`, 404)
        );
      }

      this.logger.info(`Updated ${this.entityName} with id: ${id}`);
      
      res.status(200).json(
        ApiResponse.updated(data, `${this.entityName} updated successfully`)
      );
    } catch (error) {
      throw error;
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.delete(id, req.user?.id);

      if (!result) {
        return res.status(404).json(
          ApiResponse.error(`${this.entityName} not found`, 404)
        );
      }

      this.logger.info(`Deleted ${this.entityName} with id: ${id}`);
      
      res.status(200).json(
        ApiResponse.deleted(`${this.entityName} deleted successfully`)
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BaseController;