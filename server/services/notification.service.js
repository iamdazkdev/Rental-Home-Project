const Notification = require("../models/Notification");
const { HTTP_STATUS } = require("../constants");

class NotificationService {
    async getUserNotifications(userId, unreadOnly) {
        let query = { userId };
        if (unreadOnly === "true") {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate("bookingId")
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false,
        });

        return { notifications, unreadCount };
    }

    async markAsRead(notificationId) {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            const error = new Error("Notification not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        notification.isRead = true;
        await notification.save();
        return notification;
    }

    async markAllAsRead(userId) {
        const result = await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );
        return result.modifiedCount;
    }

    async deleteNotification(notificationId) {
        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            const error = new Error("Notification not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return notification;
    }
}

module.exports = new NotificationService();
