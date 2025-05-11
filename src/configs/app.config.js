// src/config/app.config.js
require('dotenv').config();

class AppConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.apiPrefix = process.env.API_PREFIX || '/api/v1';
    
    this.cors = {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
      optionsSuccessStatus: 200
    };

    this.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      message: 'Too many requests from this IP, please try again later.'
    };

    this.jwt = {
      secret: process.env.JWT_SECRET || 'your-jwt-secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    };

    this.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    };

    this.fatSecret = {
      clientId: process.env.FATSECRET_CLIENT_ID,
      clientSecret: process.env.FATSECRET_CLIENT_SECRET
    };

    this.upload = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
      uploadDir: process.env.UPLOAD_DIR || 'uploads/'
    };
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production';
  }

  isTesting() {
    return this.env === 'test';
  }

  validate() {
    const required = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

module.exports = new AppConfig();