const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const { bookingIdSchema, payVnpaySchema } = require("../validators/paymentReminder.validator");
const reminderController = require("../controllers/paymentReminder.controller");

// ==========================================
// CLEAN ROUTER - PAYMENT REMINDER
// ==========================================

router.get("/vnpay-callback", asyncHandler(reminderController.vnpayCallback));
router.get("/:bookingId", validate(bookingIdSchema), asyncHandler(reminderController.getBookingDetails));
router.post("/:bookingId/confirm-cash", validate(bookingIdSchema), asyncHandler(reminderController.confirmCash));
router.post("/:bookingId/pay-vnpay", validate(payVnpaySchema), asyncHandler(reminderController.payVnpay));

module.exports = router;
