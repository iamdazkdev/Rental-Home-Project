const router = require('express').Router();
const User = require('../models/User');
const logger = require('../utils/logger');
const {HTTP_STATUS} = require('../constants');

/**
 * Update user's FCM token
 * POST /fcm/token
 */
router.post('/token', async (req, res) => {
    try {
        const {userId, fcmToken} = req.body;

        if (!userId || !fcmToken) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'userId and fcmToken are required',
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {fcmToken},
            {new: true, select: 'fcmToken'}
        );

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found',
            });
        }

        logger.fcm(`✅ FCM token updated for user ${userId}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'FCM token updated successfully',
        });
    } catch (error) {
        logger.error('❌ Error updating FCM token:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update FCM token',
            error: error.message,
        });
    }
});

/**
 * Delete user's FCM token (on logout)
 * DELETE /fcm/token/:userId
 */
router.delete('/token/:userId', async (req, res) => {
    try {
        const {userId} = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            {fcmToken: null},
            {new: true}
        );

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found',
            });
        }

        logger.fcm(`🗑️ FCM token deleted for user ${userId}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'FCM token deleted successfully',
        });
    } catch (error) {
        logger.error('❌ Error deleting FCM token:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete FCM token',
            error: error.message,
        });
    }
});

/**
 * Test notification endpoint
 * POST /fcm/test
 */
router.post('/test', async (req, res) => {
    try {
        const {userId, title, body} = req.body;

        if (!userId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'userId is required',
            });
        }

        const fcmService = require('../services/fcmService');

        const result = await fcmService.sendToUser(userId, {
            title: title || 'Test Notification',
            body: body || 'This is a test notification from server',
            data: {
                type: 'test',
                id: 'test_' + Date.now(),
            },
        });

        if (!result) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'No FCM token found for user or FCM not initialized',
            });
        }

        logger.fcm(`✅ Test notification sent to user ${userId}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Test notification sent successfully',
            result,
        });
    } catch (error) {
        logger.error('❌ Error sending test notification:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message,
        });
    }
});

module.exports = router;

