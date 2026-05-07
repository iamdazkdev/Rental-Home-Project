const router = require("express").Router();
const ctrl = require("../controllers/booking.controller");
const { asyncHandler } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validateHandler");
const schema = require("../validators/booking.validator");

// CREATE
router.post("/create", validate(schema.cashBookingSchema), asyncHandler(ctrl.createCashBooking));
router.post("/create-intent", validate(schema.createIntentSchema), asyncHandler(ctrl.createIntent));
router.post("/create-from-payment", validate(schema.createFromPaymentSchema), asyncHandler(ctrl.createFromPayment));

// GET AVAILABILITY
router.get("/check-availability", validate(schema.checkAvailabilitySchema), asyncHandler(ctrl.checkAvailability));

// GET RESERVATIONS/BOOKINGS
router.get("/host/:userId", validate(schema.getUserBookingsSchema), asyncHandler(ctrl.getUserBookings));
router.get("/user/:userId", validate(schema.getUserBookingsSchema), asyncHandler(ctrl.getUserBookings));
router.get("/:id", asyncHandler(ctrl.getBookingById));

// BOOKING WORKFLOW (PATCH)
router.patch("/:id/accept", asyncHandler(ctrl.approveBooking)); // legacy frontend support
router.patch("/:id/approve", asyncHandler(ctrl.approveBooking));
router.patch("/:id/reject", validate(schema.reasonSchema), asyncHandler(ctrl.rejectBooking));
router.patch("/:id/cancel", validate(schema.reasonSchema), asyncHandler(ctrl.cancelBooking));
router.patch("/:id/checkin", asyncHandler(ctrl.checkIn));
router.patch("/:id/checkout", asyncHandler(ctrl.checkOut));
router.patch("/:id/complete", validate(schema.completeSchema), asyncHandler(ctrl.completeBooking));

// PAYMENT
router.post("/:id/record-payment", validate(schema.confirmCashPaymentSchema), asyncHandler(ctrl.confirmCashPayment));

// EXTENSIONS
router.post("/:id/extension", validate(schema.extendSchema), asyncHandler(ctrl.extendBooking));
router.patch("/:id/extension/:extensionId/approve", validate(schema.extensionActionSchema), asyncHandler(ctrl.approveExtension));
router.patch("/:id/extension/:extensionId/reject", validate(schema.extensionActionSchema), asyncHandler(ctrl.rejectExtension));

module.exports = router;
