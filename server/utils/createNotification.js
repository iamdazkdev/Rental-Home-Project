const Notification = require("../models/Notification");

/**
 * Unified notification helper.
 * Replaces 5 duplicate createNotification functions across route files.
 *
 * @param {Object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type
 * @param {string} params.message - Notification message
 * @param {string} [params.link] - Optional link
 * @param {string} [params.bookingId] - Optional booking reference
 * @param {string} [params.rentalRequestId] - Optional rental request reference
 * @param {string} [params.roommatePostId] - Optional roommate post reference
 * @returns {Promise<Object|null>} Created notification or null on error
 */
const createNotification = async ({
    userId,
    type,
    message,
    link = "",
    bookingId = null,
    rentalRequestId = null,
    roommatePostId = null,
}) => {
    try {
        const data = { userId, type, message, link };

        if (bookingId) data.bookingId = bookingId;
        if (rentalRequestId) data.rentalRequestId = rentalRequestId;
        if (roommatePostId) data.roommatePostId = roommatePostId;

        const notification = await Notification.create(data);
        console.log(`🔔 Notification [${type}] created for user ${userId}`);
        return notification;
    } catch (error) {
        console.error(`❌ Error creating notification [${type}]:`, error.message);
        return null;
    }
};

module.exports = createNotification;
