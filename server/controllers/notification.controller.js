const notificationService = require("../services/notification.service");
const { HTTP_STATUS } = require("../constants");

const getUserNotifications = async (req, res) => {
    const { userId } = req.params;
    const { unreadOnly } = req.query;
    
    const result = await notificationService.getUserNotifications(userId, unreadOnly);
    
    res.status(HTTP_STATUS.OK).json({
        notifications: result.notifications,
        unreadCount: result.unreadCount,
    });
};

const markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId);
    
    res.status(HTTP_STATUS.OK).json({
        message: "Notification marked as read",
        notification,
    });
};

const markAllAsRead = async (req, res) => {
    const { userId } = req.params;
    const count = await notificationService.markAllAsRead(userId);
    
    res.status(HTTP_STATUS.OK).json({
        message: "All notifications marked as read",
        count,
    });
};

const deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    await notificationService.deleteNotification(notificationId);
    
    res.status(HTTP_STATUS.OK).json({
        message: "Notification deleted successfully",
    });
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
