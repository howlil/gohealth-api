const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ApiError = require('../libs/http/ApiError');
const Database = require('../database/prisma');
const AppConfig = require('../config/app.config');
const OAuthConfig = require('../config/oauth.config');
const Logger = require('../libs/logger/Logger');

class AuthService {
  constructor() {
    this.prisma = Database.getClient();
    this.googleClient = new OAuth2Client(AppConfig.google.web.clientId);
    this.logger = Logger;
  }

  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw ApiError.conflict('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          age: userData.age,
          gender: userData.gender
        }
      });

      const schema = {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
      }

      return schema

    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      // Check if user has password (might be Google OAuth user)
      if (!user.password) {
        throw ApiError.unauthorized('Please login with Google');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      const schema = {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType,
      }

      return schema
    } catch (error) {
      this.logger.error('Login failed', error);
      throw error;
    }
  }

  async googleAuth(idToken, clientType = 'web') {
    try {
      // Verify Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: OAuthConfig.getAudience()
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw ApiError.unauthorized('Invalid Google token');
      }

      // Create or update user in database
      const user = await this.prisma.user.upsert({
        where: { googleId: payload.sub },
        update: {
          email: payload.email,
          name: payload.name,
          profileImage: payload.picture,
          updatedAt: new Date()
        },
        create: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          profileImage: payload.picture
        }
      });

      // Generate JWT tokens
      const tokens = this.generateTokens(user);

      this.logger.info(`User ${user.id} authenticated via Google OAuth`);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      this.logger.error('Google authentication failed', error);
      throw ApiError.unauthorized('Invalid Google token');
    }
  }

  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email
    };

    const accessToken = jwt.sign(
      payload,
      AppConfig.jwt.secret,
      { expiresIn: AppConfig.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      payload,
      AppConfig.jwt.secret,
      { expiresIn: AppConfig.jwt.refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: AppConfig.jwt.expiresIn
    };
  }

  async refreshToken(refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, AppConfig.jwt.secret);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id }
      });

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }

  async verifyToken(token) {
    try {
      const payload = jwt.verify(token, AppConfig.jwt.secret);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id }
      });

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      return user;
    } catch (error) {
      throw ApiError.unauthorized('Invalid token');
    }
  }

  async logout(userId) {
    try {
      // In a more sophisticated system, you might want to:
      // 1. Blacklist the token
      // 2. Clear refresh tokens from database
      // 3. Update last logout time

      this.logger.info(`User ${userId} logged out`);
      return true;
    } catch (error) {
      this.logger.error('Logout failed', error);
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          gender: true,
          height: true,
          weight: true,
          activityLevel: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error('Error getting current user', error);
      throw error;
    }
  }

  sanitizeUser(user) {
    const { googleId, password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = AuthService;