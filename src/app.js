// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');

const AppConfig = require('./config/app.config');
const Database = require('./database/prisma');
const Routes = require('./routes');
const ErrorMiddleware = require('./middleware/error.middleware');
const Logger = require('./libs/logger/Logger');
const SwaggerMiddleware = require('./middleware/swagger.middleware');
const dateFormatter = require('./middleware/dateFormatter');

class App {
  constructor() {
    this.app = express();
    this.config = AppConfig;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
   
    this.app.use(cors(this.config.cors));


    this.app.use(morgan('combined', {
      stream: {
        write: (message) => Logger.http(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use('/uploads', express.static(path.join(process.cwd(), this.config.upload.uploadDir)));

    // Passport
    this.app.use(passport.initialize());
    require('./config/passport.config')(passport);

    // Date formatter
    this.app.use(dateFormatter);
  }

  setupRoutes() {
    SwaggerMiddleware.setup(this.app);

    // API routes
    this.app.use('/api', Routes);

    this.app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to GoHealth API',
        version: '1.0.0',
        docs: '/api-docs'
      });
    });
  }

  setupErrorHandling() {
    this.app.use(ErrorMiddleware.notFound());

    this.app.use(ErrorMiddleware.errorHandler());
  }

  async start() {
    try {
      this.config.validate();

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