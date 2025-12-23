const router = require("express").Router();
const Notification = require("../models/Notification");
const { HTTP_STATUS } = require("../constants");

// GET USER NOTIFICATIONS
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { unreadOnly } = req.query;

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

    console.log(`✅ Found ${notifications.length} notifications for user ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// MARK NOTIFICATION AS READ
router.patch("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    console.log(`✅ Notification ${notificationId} marked as read`);

    res.status(HTTP_STATUS.OK).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch("/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "All notifications marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
});

// DELETE NOTIFICATION
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Notification not found",
      });
    }

    console.log(`✅ Notification ${notificationId} deleted`);

    res.status(HTTP_STATUS.OK).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
});

module.exports = router;

