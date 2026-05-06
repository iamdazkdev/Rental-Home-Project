const router = require("express").Router();
const ctrl = require("../controllers/booking.controller");

// CREATE
router.post("/create", ctrl.createCashBooking);
router.post("/create-intent", ctrl.createIntent);
router.post("/create-from-payment", ctrl.createFromPayment);

// GET AVAILABILITY
router.get("/check-availability", ctrl.checkAvailability);

// GET RESERVATIONS/BOOKINGS
router.get("/host/:userId", ctrl.getUserBookings);
router.get("/user/:userId", ctrl.getUserBookings);
router.get("/:id", ctrl.getBookingById);

// BOOKING WORKFLOW (PATCH)
router.patch("/:id/accept", ctrl.approveBooking); // legacy frontend support
router.patch("/:id/approve", ctrl.approveBooking);
router.patch("/:id/reject", ctrl.rejectBooking);
router.patch("/:id/cancel", ctrl.cancelBooking);
router.patch("/:id/checkin", ctrl.checkIn);
router.patch("/:id/checkout", ctrl.checkOut);
router.patch("/:id/complete", ctrl.completeBooking);

// PAYMENT
router.post("/:id/record-payment", ctrl.confirmCashPayment);

// EXTENSIONS
router.post("/:id/extension", ctrl.extendBooking);
router.patch("/:id/extension/:extensionId/approve", ctrl.approveExtension);
router.patch("/:id/extension/:extensionId/reject", ctrl.rejectExtension);

module.exports = router;
