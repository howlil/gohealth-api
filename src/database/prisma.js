// src/database/prisma.js
const { PrismaClient } = require('../generated/prisma');
const Logger = require('../libs/logger/Logger');

class Database {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    this.setupLogging();
  }

  setupLogging() {
    this.prisma.$on('query', (e) => {
      Logger.debug(`Query: ${e.query} - Params: ${e.params}`);
    });

    this.prisma.$on('error', (e) => {
      Logger.error(`Prisma Error: ${e.message}`);
    });

    this.prisma.$on('info', (e) => {
      Logger.info(`Prisma Info: ${e.message}`);
    });

    this.prisma.$on('warn', (e) => {
      Logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      Logger.info('Database connected successfully');
    } catch (error) {
      Logger.error('Database connection failed', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      Logger.info('Database disconnected successfully');
    } catch (error) {
      Logger.error('Database disconnection failed', error);
      throw error;
    }
  }

  getClient() {
    return this.prisma;
  }
}

module.exports = new Database();