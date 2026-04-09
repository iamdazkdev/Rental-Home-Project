const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const { createPaymentUrlSchema, queryTransactionSchema } = require("../validators/payment.validator");
const paymentController = require("../controllers/payment.controller");

// ==========================================
// CLEAN ROUTER - PAYMENT
// ==========================================

router.post("/create-payment-url", validate(createPaymentUrlSchema), asyncHandler(paymentController.createPaymentUrl));
router.get("/vnpay-return", asyncHandler(paymentController.vnpayReturn));
router.post("/vnpay-ipn", asyncHandler(paymentController.vnpayIpn));
router.get("/status/:bookingId", asyncHandler(paymentController.getStatus));
router.post("/query-transaction", validate(queryTransactionSchema), asyncHandler(paymentController.queryTransaction));
router.post("/cleanup-expired", asyncHandler(paymentController.cleanupExpired));
router.get("/pending/:tempOrderId", asyncHandler(paymentController.getPendingBooking));

module.exports = router;
