const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  userIdSchema,
  notifyIdSchema,
  userIdParamSchema
} = require("../validators/notification.validator");
const notificationController = require("../controllers/notification.controller");

// ==========================================
// CLEAN ROUTER - NOTIFICATIONS
// ==========================================

router.get("/:userId", validate(userIdSchema), asyncHandler(notificationController.getUserNotifications));
router.patch("/:notificationId/read", validate(notifyIdSchema), asyncHandler(notificationController.markAsRead));
router.patch("/user/:userId/read-all", validate(userIdParamSchema), asyncHandler(notificationController.markAllAsRead));
router.delete("/:notificationId", validate(notifyIdSchema), asyncHandler(notificationController.deleteNotification));

module.exports = router;
