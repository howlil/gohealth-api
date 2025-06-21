const BaseService = require('./base.service');
const FCMConfig = require('../config/fcm.config');
const ApiError = require('../libs/http/ApiError');

class NotificationService extends BaseService {
    constructor() {
        super();
        FCMConfig.initialize();
    }

    // Create and save notification to database
    async createNotification(userId, notificationData) {
        try {
            const { type, title, body, data } = notificationData;

            this.logger.info(`Creating notification for user ${userId}: ${title}`);

            const notification = await this.prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    body,
                    data: data || {},
                    isRead: false,
                    isSent: false
                }
            });

            return notification;
        } catch (error) {
            this.logger.error('Error creating notification:', error);
            throw error;
        }
    }

    // Get user notifications with pagination
    async getUserNotifications(userId, options = {}) {
        try {
            const {
                page = 0,
                limit = 20,
                isRead = null,
                type = null
            } = options;

            this.logger.info(`Fetching notifications for user ${userId}`);

            const where = {
                userId
            };

            if (isRead !== null) {
                where.isRead = isRead;
            }

            if (type) {
                where.type = type;
            }

            const [notifications, total] = await Promise.all([
                this.prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: page * limit,
                    take: limit,
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        body: true,
                        data: true,
                        isRead: true,
                        isSent: true,
                        sentAt: true,
                        readAt: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }),
                this.prisma.notification.count({ where })
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                data: notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        } catch (error) {
            this.logger.error('Error fetching user notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    async markAsRead(userId, notificationId) {
        try {
            this.logger.info(`Marking notification ${notificationId} as read for user ${userId}`);

            const notification = await this.prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    userId
                }
            });

            if (!notification) {
                throw ApiError.notFound('Notification not found');
            }

            const updatedNotification = await this.prisma.notification.update({
                where: { id: notificationId },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            return updatedNotification;
        } catch (error) {
            this.logger.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
        try {
            this.logger.info(`Marking all notifications as read for user ${userId}`);

            const result = await this.prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            return { count: result.count };
        } catch (error) {
            this.logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Get unread notification count
    async getUnreadCount(userId) {
        try {
            const count = await this.prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            });

            return { count };
        } catch (error) {
            this.logger.error('Error getting unread notification count:', error);
            throw error;
        }
    }

    // Delete notification
    async deleteNotification(userId, notificationId) {
        try {
            this.logger.info(`Deleting notification ${notificationId} for user ${userId}`);

            const notification = await this.prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    userId
                }
            });

            if (!notification) {
                throw ApiError.notFound('Notification not found');
            }

            await this.prisma.notification.delete({
                where: { id: notificationId }
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Error deleting notification:', error);
            throw error;
        }
    }

    async updateFCMToken(userId, fcmToken) {
        try {
            this.logger.info(`Updating FCM token for user ${userId}`);

            const user = await this.prisma.user.update({
                where: { id: userId },
                data: { fcmToken }
            });

            return {
                success: true,
                message: 'FCM token updated successfully'
            };
        } catch (error) {
            this.logger.error('Error updating FCM token:', error);
            throw error;
        }
    }

    async removeFCMToken(userId) {
        try {
            this.logger.info(`Removing FCM token for user ${userId}`);

            await this.prisma.user.update({
                where: { id: userId },
                data: { fcmToken: null }
            });

            return {
                success: true,
                message: 'FCM token removed successfully'
            };
        } catch (error) {
            this.logger.error('Error removing FCM token:', error);
            throw error;
        }
    }

    async sendPushNotification(userId, notification) {
        try {
            // First create notification in database
            const dbNotification = await this.createNotification(userId, notification);

            const messaging = FCMConfig.getMessaging();
            if (!messaging) {
                this.logger.warn('FCM not initialized, notification saved but not sent');
                return dbNotification;
            }

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { fcmToken: true, name: true }
            });

            if (!user || !user.fcmToken) {
                this.logger.debug(`No FCM token found for user ${userId}, notification saved but not sent`);
                return dbNotification;
            }

            const message = {
                token: user.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: {
                    notificationId: dbNotification.id,
                    ...notification.data
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'gohealth_notifications',
                        priority: 'high',
                        defaultSound: true,
                        defaultVibrateTimings: true
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.body
                            },
                            sound: 'default',
                            badge: notification.badge || 0
                        }
                    }
                }
            };

            const response = await messaging.send(message);
            this.logger.info(`Push notification sent successfully to user ${userId}:`, response);

            // Update notification as sent
            await this.prisma.notification.update({
                where: { id: dbNotification.id },
                data: {
                    isSent: true,
                    sentAt: new Date()
                }
            });

            return { ...dbNotification, isSent: true, sentAt: new Date() };
        } catch (error) {
            this.logger.error('Error sending push notification:', error);

            if (error.code === 'messaging/registration-token-not-registered') {
                await this.removeFCMToken(userId);
            }

            throw error;
        }
    }

    async sendBulkNotifications(userIds, notification) {
        try {
            const messaging = FCMConfig.getMessaging();
            if (!messaging) {
                this.logger.warn('FCM not initialized, skipping bulk notifications');
                return null;
            }

            const users = await this.prisma.user.findMany({
                where: {
                    id: { in: userIds },
                    fcmToken: { not: null }
                },
                select: { id: true, fcmToken: true }
            });

            if (users.length === 0) {
                this.logger.debug('No users with FCM tokens found');
                return { success: 0, failure: userIds.length };
            }

            const messages = users.map(user => ({
                token: user.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: notification.data || {},
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'gohealth_notifications',
                        priority: 'high',
                        defaultSound: true,
                        defaultVibrateTimings: true
                    }
                }
            }));

            const response = await messaging.sendEach(messages);
            this.logger.info(`Bulk notifications sent: ${response.successCount} success, ${response.failureCount} failed`);

            if (response.responses) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                        this.removeFCMToken(users[idx].id).catch(err =>
                            this.logger.error(`Failed to remove invalid token for user ${users[idx].id}:`, err)
                        );
                    }
                });
            }

            return {
                success: response.successCount,
                failure: response.failureCount
            };
        } catch (error) {
            this.logger.error('Error sending bulk notifications:', error);
            throw error;
        }
    }

    async sendDailyCaloryAchievementNotification(userId, data) {
        try {
            const { currentCalories, targetCalories, percentage } = data;

            const notification = {
                type: 'DAILY_CALORY_ACHIEVEMENT',
                title: '🎉 Daily Calory Goal Achieved!',
                body: `Congratulations! You've consumed ${currentCalories} out of ${targetCalories} calories (${percentage}%). Keep up the great work!`,
                data: {
                    type: 'DAILY_CALORY_ACHIEVEMENT',
                    currentCalories: String(currentCalories),
                    targetCalories: String(targetCalories),
                    percentage: String(percentage),
                    timestamp: new Date().toISOString()
                }
            };

            return await this.sendPushNotification(userId, notification);
        } catch (error) {
            this.logger.error('Error sending daily calory achievement notification:', error);
            throw error;
        }
    }

    async sendMealReminderNotification(userId, mealType) {
        try {
            const mealTypeText = mealType.charAt(0) + mealType.slice(1).toLowerCase();

            const notification = {
                type: 'MEAL_REMINDER',
                title: `⏰ ${mealTypeText} Reminder`,
                body: `Don't forget to log your ${mealTypeText.toLowerCase()}! Track your meals to stay on top of your nutrition goals.`,
                data: {
                    type: 'MEAL_REMINDER',
                    mealType: mealType,
                    timestamp: new Date().toISOString()
                }
            };

            return await this.sendPushNotification(userId, notification);
        } catch (error) {
            this.logger.error('Error sending meal reminder notification:', error);
            throw error;
        }
    }

    async sendWeightGoalProgressNotification(userId, data) {
        try {
            const { currentWeight, targetWeight, progress } = data;

            const notification = {
                type: 'WEIGHT_GOAL_PROGRESS',
                title: '📊 Weight Goal Progress Update',
                body: `You're ${progress}% closer to your goal! Current: ${currentWeight}kg, Target: ${targetWeight}kg`,
                data: {
                    type: 'WEIGHT_GOAL_PROGRESS',
                    currentWeight: String(currentWeight),
                    targetWeight: String(targetWeight),
                    progress: String(progress),
                    timestamp: new Date().toISOString()
                }
            };

            return await this.sendPushNotification(userId, notification);
        } catch (error) {
            this.logger.error('Error sending weight goal progress notification:', error);
            throw error;
        }
    }
}

module.exports = NotificationService; 