const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  userIdSchema,
  getMessagesSchema,
  sendMessageSchema,
  markReadSchema
} = require("../validators/message.validator");
const messageController = require("../controllers/message.controller");

// ==========================================
// CLEAN ROUTER - MESSAGES
// ==========================================

router.get("/conversations/:userId", validate(userIdSchema), asyncHandler(messageController.getConversations));
router.get("/messages/:conversationId", validate(getMessagesSchema), asyncHandler(messageController.getMessages));
router.post("/messages", validate(sendMessageSchema), asyncHandler(messageController.sendMessage));
router.get("/unread/:userId", validate(userIdSchema), asyncHandler(messageController.getUnreadCount));
router.patch("/conversations/:conversationId/read", validate(markReadSchema), asyncHandler(messageController.markAsRead));

module.exports = router;
