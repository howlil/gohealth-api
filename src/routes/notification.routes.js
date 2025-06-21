const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const AuthMiddleware = require('../middleware/auth.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const schemas = require('../validations/schemas');

class NotificationRoutes {
    constructor() {
        this.router = express.Router();
        this.notificationController = new NotificationController();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Get user notifications
        this.router.get(
            '/',
            AuthMiddleware.authenticate(),
            ValidationMiddleware.validate(schemas.getNotifications),
            ErrorMiddleware.asyncHandler(this.notificationController.getNotifications.bind(this.notificationController))
        );

        // Get unread notification count
        this.router.get(
            '/unread-count',
            AuthMiddleware.authenticate(),
            ErrorMiddleware.asyncHandler(this.notificationController.getUnreadCount.bind(this.notificationController))
        );

        // Mark specific notification as read
        this.router.patch(
            '/:notificationId/read',
            AuthMiddleware.authenticate(),
            ValidationMiddleware.validate(schemas.markNotificationAsRead),
            ErrorMiddleware.asyncHandler(this.notificationController.markAsRead.bind(this.notificationController))
        );

        // Mark all notifications as read
        this.router.patch(
            '/read-all',
            AuthMiddleware.authenticate(),
            ErrorMiddleware.asyncHandler(this.notificationController.markAllAsRead.bind(this.notificationController))
        );

        // Delete notification
        this.router.delete(
            '/:notificationId',
            AuthMiddleware.authenticate(),
            ValidationMiddleware.validate(schemas.deleteNotification),
            ErrorMiddleware.asyncHandler(this.notificationController.deleteNotification.bind(this.notificationController))
        );

        // Test notification (for debugging)
        this.router.post(
            '/test',
            AuthMiddleware.authenticate(),
            ValidationMiddleware.validate(schemas.testNotification),
            ErrorMiddleware.asyncHandler(this.notificationController.testNotification.bind(this.notificationController))
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new NotificationRoutes().getRouter(); 