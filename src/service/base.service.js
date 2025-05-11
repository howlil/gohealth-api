// src/services/base.service.js
const Database = require('../database/prisma');
const ApiError = require('../libs/http/ApiError');
const Logger = require('../libs/logger/Logger');

class BaseService {
  constructor(modelName) {
    this.modelName = modelName;
    this.prisma = Database.getClient();
    this.model = this.prisma[modelName];
    this.logger = Logger;
  }

  async findAll({ page = 1, limit = 10, filters = {}, userId = null }) {
    try {
      const skip = (page - 1) * limit;
      const where = userId ? { ...filters, userId } : filters;

      const [data, total] = await this.prisma.$transaction([
        this.model.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.model.count({ where })
      ]);

      return { data, total };
    } catch (error) {
      this.logger.error(`Error finding all ${this.modelName}s: ${error.message}`);
      throw error;
    }
  }

  async findById(id, userId = null) {
    try {
      const where = userId ? { id, userId } : { id };
      return await this.model.findUnique({ where });
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName} by id: ${error.message}`);
      throw error;
    }
  }

  async create(data) {
    try {
      return await this.model.create({ data });
    } catch (error) {
      this.logger.error(`Error creating ${this.modelName}: ${error.message}`);
      throw error;
    }
  }

  async update(id, data, userId = null) {
    try {
      const where = userId ? { id, userId } : { id };
      
      // Check if record exists
      const exists = await this.model.findUnique({ where });
      if (!exists) {
        throw ApiError.notFound(`${this.modelName} not found`);
      }

      return await this.model.update({ where, data });
    } catch (error) {
      this.logger.error(`Error updating ${this.modelName}: ${error.message}`);
      throw error;
    }
  }

  async delete(id, userId = null) {
    try {
      const where = userId ? { id, userId } : { id };
      
      // Check if record exists
      const exists = await this.model.findUnique({ where });
      if (!exists) {
        throw ApiError.notFound(`${this.modelName} not found`);
      }

      await this.model.delete({ where });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting ${this.modelName}: ${error.message}`);
      throw error;
    }
  }

  async transaction(operations) {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      this.logger.error(`Transaction error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BaseService;