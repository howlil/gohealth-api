// src/config/app.config.js
require('dotenv').config();

class AppConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.apiPrefix = '/api';

    this.cors = {
      origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN?.split(','),
      credentials: true,
      optionsSuccessStatus: 200
    };

    this.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      // Skip successful requests from rate limiting
      skipSuccessfulRequests: false,
      // Store configuration
      skipFailedRequests: false
    };

    this.jwt = {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    };

    this.google = {
      web: {
        clientId: process.env.GOOGLE_WEB_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_WEB_REDIRECT_URI
      },
      android: {
        clientId: process.env.GOOGLE_ANDROID_CLIENT_ID
      },
      ios: {
        clientId: process.env.GOOGLE_IOS_CLIENT_ID
      }
    };

    this.foodData = {
      filePath: process.env.FOOD_DATA_FILE_PATH || 'data.json',
      defaultData: [
        {
          "fdcId": 170379,
          "description": "Chicken breast, meat only, cooked",
          "foodCategory": "Poultry",
          "foodNutrients": [
            {
              "nutrient": {
                "id": 1003,
                "name": "Protein",
                "unitName": "g"
              },
              "amount": 31.02
            },
            {
              "nutrient": {
                "id": 1004,
                "name": "Total lipid (fat)",
                "unitName": "g"
              },
              "amount": 3.57
            },
            {
              "nutrient": {
                "id": 1008,
                "name": "Energy",
                "unitName": "kcal"
              },
              "amount": 165
            }
          ]
        },
        {
          "fdcId": 175196,
          "description": "Rice, white, cooked",
          "foodCategory": "Grains and Pasta",
          "foodNutrients": [
            {
              "nutrient": {
                "id": 1003,
                "name": "Protein",
                "unitName": "g"
              },
              "amount": 2.69
            },
            {
              "nutrient": {
                "id": 1004,
                "name": "Total lipid (fat)",
                "unitName": "g"
              },
              "amount": 0.28
            },
            {
              "nutrient": {
                "id": 1008,
                "name": "Energy",
                "unitName": "kcal"
              },
              "amount": 130
            }
          ]
        }
      ]
    };

    this.upload = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
      uploadDir: process.env.UPLOAD_DIR || 'uploads/'
    };

    this.logging = {
      level: process.env.LOG_LEVEL || 'info'
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
    const required = [
      'JWT_SECRET',
      'GOOGLE_WEB_CLIENT_ID',
      'GOOGLE_WEB_CLIENT_SECRET',
      'DATABASE_URL'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Optional variables warning
    const optional = [
      'GOOGLE_ANDROID_CLIENT_ID',
      'GOOGLE_IOS_CLIENT_ID',
      'FOOD_DATA_FILE_PATH'
    ];

    const missingOptional = optional.filter(key => !process.env[key]);

    if (missingOptional.length > 0) {
      console.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
    }
  }
}

module.exports = new AppConfig();