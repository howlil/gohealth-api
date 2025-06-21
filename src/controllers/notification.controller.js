const BaseController = require('./base.controller');
const NotificationService = require('../services/notification.service');
const ApiResponse = require('../libs/http/ApiResponse');
const ApiError = require('../libs/http/ApiError');

class NotificationController extends BaseController {
    constructor() {
        super(new NotificationService(), 'Notification');
        this.notificationService = new NotificationService();
    }

    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page = 0, limit = 20, isRead, type } = req.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };

            // Parse isRead parameter
            if (isRead !== undefined) {
                options.isRead = isRead === 'true';
            }

            // Add type filter if provided
            if (type) {
                options.type = type;
            }

            const result = await this.notificationService.getUserNotifications(userId, options);

            this.logger.info(`User ${userId} retrieved notifications`);

            res.status(200).json(
                ApiResponse.success(result, 'Notifications retrieved successfully')
            );
        } catch (error) {
            throw error;
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const result = await this.notificationService.getUnreadCount(userId);

            this.logger.info(`User ${userId} retrieved unread notification count: ${result.count}`);

            res.status(200).json(
                ApiResponse.success(result, 'Unread notification count retrieved successfully')
            );
        } catch (error) {
            throw error;
        }
    }

    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            const notification = await this.notificationService.markAsRead(userId, notificationId);

            this.logger.info(`User ${userId} marked notification ${notificationId} as read`);

            res.status(200).json(
                ApiResponse.success(notification, 'Notification marked as read')
            );
        } catch (error) {
            throw error;
        }
    }

    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const result = await this.notificationService.markAllAsRead(userId);

            this.logger.info(`User ${userId} marked all notifications as read. Count: ${result.count}`);

            res.status(200).json(
                ApiResponse.success(result, 'All notifications marked as read')
            );
        } catch (error) {
            throw error;
        }
    }

    async deleteNotification(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            await this.notificationService.deleteNotification(userId, notificationId);

            this.logger.info(`User ${userId} deleted notification ${notificationId}`);

            res.status(200).json(
                ApiResponse.success(null, 'Notification deleted successfully')
            );
        } catch (error) {
            throw error;
        }
    }

    async testNotification(req, res) {
        try {
            const userId = req.user.id;
            const { title, body, type = 'GENERAL' } = req.body;

            this.logger.info(`Sending test notification to user ${userId}`);

            const notification = await this.notificationService.sendPushNotification(userId, {
                type: type,
                title: title || '🧪 Test Notification',
                body: body || 'This is a test notification to verify that your notification system is working properly!',
                data: {
                    type: 'TEST_NOTIFICATION',
                    timestamp: new Date().toISOString()
                }
            });

            this.logger.info(`Test notification sent to user ${userId}`);

            res.status(200).json(
                ApiResponse.success(notification, 'Test notification sent successfully')
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = NotificationController; 