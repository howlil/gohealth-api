// src/config/oauth.config.js
require('dotenv').config();

class OAuthConfig {
  constructor() {
    // Google OAuth configuration for different platforms
    this.google = {
      // Web configuration
      web: {
        clientId: process.env.GOOGLE_WEB_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_WEB_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      },
      
      // Android configuration
      android: {
        clientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
        // Android doesn't use client secret
      },
      
      // iOS configuration
      ios: {
        clientId: process.env.GOOGLE_IOS_CLIENT_ID,
        // iOS doesn't use client secret
      }
    };

    // Allowed client types
    this.allowedClientTypes = ['web', 'android', 'ios'];

    // Audience for ID token verification (all client IDs)
    this.audience = [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID
    ].filter(Boolean);
  }

  getClientConfig(clientType) {
    if (!this.allowedClientTypes.includes(clientType)) {
      throw new Error(`Invalid client type: ${clientType}`);
    }

    return this.google[clientType];
  }

  getAudience() {
    return this.audience;
  }

  validate() {
    const required = [
      'GOOGLE_WEB_CLIENT_ID',
      'GOOGLE_ANDROID_CLIENT_ID',
      'GOOGLE_IOS_CLIENT_ID'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.warn(`Missing OAuth environment variables: ${missing.join(', ')}`);
    }
  }
}

module.exports = new OAuthConfig();