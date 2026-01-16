const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Firebase Cloud Messaging Service
 * Handles sending push notifications to mobile devices
 */
class FCMService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize Firebase Admin SDK
     * Call this once when server starts
     */
    initialize(serviceAccount) {
        try {
            if (this.initialized) {
                logger.info('FCM already initialized');
                return;
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            this.initialized = true;
            logger.success('✅ Firebase Admin SDK initialized');
        } catch (error) {
            logger.error('❌ Error initializing Firebase Admin:', error.message);
            throw error;
        }
    }

    /**
     * Send notification to a specific device (FCM token)
     */
    async sendToDevice(fcmToken, notification) {
        try {
            if (!this.initialized) {
                logger.warn('⚠️ FCM not initialized, skipping notification');
                return null;
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: notification.data || {},
                token: fcmToken,
            };

            const response = await admin.messaging().send(message);
            logger.fcm(`✅ Notification sent to device: ${response}`);
            return response;
        } catch (error) {
            logger.error('❌ Error sending notification:', error.message);
            throw error;
        }
    }

    /**
     * Send notification to multiple devices
     */
    async sendToMultipleDevices(fcmTokens, notification) {
        try {
            if (!this.initialized) {
                logger.warn('⚠️ FCM not initialized, skipping notification');
                return null;
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: notification.data || {},
                tokens: fcmTokens,
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            logger.fcm(`✅ Sent to ${response.successCount}/${fcmTokens.length} devices`);

            if (response.failureCount > 0) {
                logger.warn(`⚠️ ${response.failureCount} notifications failed`);
            }

            return response;
        } catch (error) {
            logger.error('❌ Error sending multicast notification:', error.message);
            throw error;
        }
    }

    /**
     * Send notification to a topic
     */
    async sendToTopic(topic, notification) {
        try {
            if (!this.initialized) {
                logger.warn('⚠️ FCM not initialized, skipping notification');
                return null;
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: notification.data || {},
                topic: topic,
            };

            const response = await admin.messaging().send(message);
            logger.fcm(`✅ Notification sent to topic '${topic}': ${response}`);
            return response;
        } catch (error) {
            logger.error(`❌ Error sending to topic '${topic}':`, error.message);
            throw error;
        }
    }

    /**
     * Send notification to user by userId
     * Looks up FCM token from database
     */
    async sendToUser(userId, notification) {
        try {
            const User = require('../models/User');

            const user = await User.findById(userId).select('fcmToken');

            if (!user || !user.fcmToken) {
                logger.warn(`⚠️ No FCM token found for user ${userId}`);
                return null;
            }

            return await this.sendToDevice(user.fcmToken, notification);
        } catch (error) {
            logger.error('❌ Error sending notification to user:', error.message);
            throw error;
        }
    }

    /**
     * Send booking notification (helper)
     */
    async sendBookingNotification(userId, booking, type) {
        const notifications = {
            new_booking: {
                title: 'New Booking Request',
                body: `You have a new booking request for ${booking.listingId?.title || 'your property'}`,
            },
            booking_confirmed: {
                title: 'Booking Confirmed',
                body: `Your booking has been confirmed!`,
            },
            booking_cancelled: {
                title: 'Booking Cancelled',
                body: `A booking has been cancelled`,
            },
        };

        const notificationData = notifications[type] || {
            title: 'Booking Update',
            body: 'Your booking status has changed',
        };

        return await this.sendToUser(userId, {
            title: notificationData.title,
            body: notificationData.body,
            data: {
                type,
                id: booking._id.toString(),
                bookingId: booking._id.toString(),
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
        });
    }

    /**
     * Send message notification (helper)
     */
    async sendMessageNotification(userId, message) {
        return await this.sendToUser(userId, {
            title: 'New Message',
            body: message.text || 'You have a new message',
            data: {
                type: 'new_message',
                id: message.conversationId,
                conversationId: message.conversationId,
                senderId: message.senderId.toString(),
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
        });
    }

    /**
     * Send payment notification (helper)
     */
    async sendPaymentNotification(userId, payment, type) {
        const notifications = {
            payment_received: {
                title: 'Payment Received',
                body: `You received a payment of ${payment.amount}`,
            },
            payment_reminder: {
                title: 'Payment Reminder',
                body: `Please complete your payment`,
            },
        };

        const notificationData = notifications[type] || {
            title: 'Payment Update',
            body: 'Payment status updated',
        };

        return await this.sendToUser(userId, {
            title: notificationData.title,
            body: notificationData.body,
            data: {
                type,
                id: payment._id.toString(),
                paymentId: payment._id.toString(),
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
        });
    }
}

module.exports = new FCMService();

