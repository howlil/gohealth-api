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
      this.logger.info(`Attempting to register user with email: ${userData.email}`);

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        this.logger.warn(`Registration failed: Email ${userData.email} already registered`);
        throw ApiError.conflict('Email already registered');
      }

      // Hash password
      this.logger.debug('Hashing password...');
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      this.logger.debug('Creating new user record...');
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          age: userData.age,
          gender: userData.gender
        }
      });

      this.logger.info(`User registered successfully with ID: ${user.id}`);

      const schema = {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
      }

      return schema

    } catch (error) {
      this.logger.error('Registration failed', {
        error: error.message,
        stack: error.stack,
        email: userData.email
      });
      throw error;
    }
  }

  async login(email, password) {
    try {
      this.logger.info(`Login attempt for email: ${email}`);

      // Find user by email
      this.logger.debug('Finding user by email...');
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        this.logger.warn(`Login failed: Email ${email} not found`);
        throw ApiError.unauthorized('Email tidak ditemukan');
      }

      // Check if user has password (might be Google OAuth user)
      if (!user.password) {
        this.logger.warn(`Login failed: User ${user.id} has no password (Google OAuth user)`);
        throw ApiError.unauthorized('Akun ini hanya bisa login dengan Google');
      }

      // Verify password
      this.logger.debug('Verifying password...');
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for user ${user.id}`);
        throw ApiError.unauthorized('Password salah');
      }

      // Generate tokens
      this.logger.debug('Generating authentication tokens...');
      const tokens = this.generateTokens(user);

      this.logger.info(`User ${user.id} logged in successfully`);

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
      this.logger.error('Login failed', {
        error: error.message,
        stack: error.stack,
        email
      });
      throw error;
    }
  }

  async googleAuth(idToken, clientType = 'web') {
    try {
      this.logger.info('Attempting Google OAuth authentication');

      // Verify Google ID token
      this.logger.debug('Verifying Google ID token...');
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: OAuthConfig.getAudience()
      });

      const payload = ticket.getPayload();

      if (!payload) {
        this.logger.warn('Google authentication failed: Invalid token payload');
        throw ApiError.unauthorized('Invalid Google token');
      }

      this.logger.debug(`Google token verified for email: ${payload.email}`);

      // Create or update user in database
      this.logger.debug('Creating/updating user record...');
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
      this.logger.debug('Generating authentication tokens...');
      const tokens = this.generateTokens(user);

      this.logger.info(`User ${user.id} authenticated via Google OAuth successfully`);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      this.logger.error('Google authentication failed', {
        error: error.message,
        stack: error.stack
      });
      throw ApiError.unauthorized('Invalid Google token');
    }
  }

  generateTokens(user) {
    this.logger.debug(`Generating tokens for user ${user.id}`);

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

    this.logger.debug('Tokens generated successfully');

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: AppConfig.jwt.expiresIn
    };
  }

  async refreshToken(refreshToken) {
    try {
      this.logger.info('Attempting to refresh token');

      this.logger.debug('Verifying refresh token...');
      const payload = jwt.verify(refreshToken, AppConfig.jwt.secret);

      this.logger.debug(`Finding user with ID: ${payload.id}`);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id }
      });

      if (!user) {
        this.logger.warn(`Token refresh failed: User ${payload.id} not found`);
        throw ApiError.unauthorized('User not found');
      }

      this.logger.debug('Generating new tokens...');
      const tokens = this.generateTokens(user);

      this.logger.info(`Token refreshed successfully for user ${user.id}`);
      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed', {
        error: error.message,
        stack: error.stack
      });
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }

  async verifyToken(token) {
    try {
      this.logger.debug('Verifying token...');
      const payload = jwt.verify(token, AppConfig.jwt.secret);

      this.logger.debug(`Finding user with ID: ${payload.id}`);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id }
      });

      if (!user) {
        this.logger.warn(`Token verification failed: User ${payload.id} not found`);
        throw ApiError.unauthorized('User not found');
      }

      this.logger.debug(`Token verified successfully for user ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Token verification failed', {
        error: error.message,
        stack: error.stack
      });
      throw ApiError.unauthorized('Invalid token');
    }
  }

  async logout(userId) {
    try {
      this.logger.info(`User ${userId} attempting to logout`);

      // In a more sophisticated system, you might want to:
      // 1. Blacklist the token
      // 2. Clear refresh tokens from database
      // 3. Update last logout time

      this.logger.info(`User ${userId} logged out successfully`);
      return true;
    } catch (error) {
      this.logger.error('Logout failed', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      this.logger.info(`Fetching current user data for ID: ${userId}`);

      this.logger.debug('Finding user in database...');
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
        }
      });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        throw ApiError.notFound('User not found');
      }

      this.logger.info(`Current user data retrieved successfully for user ${userId}`);
      return user;
    } catch (error) {
      this.logger.error('Error getting current user', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  sanitizeUser(user) {
    this.logger.debug(`Sanitizing user data for user ${user.id}`);
    const { googleId, password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = AuthService;