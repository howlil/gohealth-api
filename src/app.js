// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const AppConfig = require('./config/app.config');
const Database = require('./database/prisma');
const Routes = require('./routes');
const ErrorMiddleware = require('./middleware/error.middleware');
const Logger = require('./libs/logger/Logger');

class App {
  constructor() {
    this.app = express();
    this.config = AppConfig;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));

    // Rate limiting
    const limiter = rateLimit(this.config.rateLimit);
    this.app.use(limiter);

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => Logger.http(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Passport
    this.app.use(passport.initialize());
    require('./config/passport.config')(passport);
  }

  setupRoutes() {
    // API routes
    this.app.use(this.config.apiPrefix, Routes);

    // Default route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to GoHealth API',
        version: '1.0.0',
        docs: `${this.config.apiPrefix}/docs`
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(ErrorMiddleware.notFound());

    // Global error handler
    this.app.use(ErrorMiddleware.errorHandler());
  }

  async start() {
    try {
      // Validate configuration
      this.config.validate();

      // Connect to database
      await Database.connect();

      // Start server
      this.app.listen(this.config.port, () => {
        Logger.info(`Server running on port ${this.config.port} in ${this.config.env} mode`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));
    } catch (error) {
      Logger.error('Failed to start application', error);
      process.exit(1);
    }
  }

  async shutdown() {
    Logger.info('Shutting down gracefully...');
    
    try {
      await Database.disconnect();
      process.exit(0);
    } catch (error) {
      Logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;