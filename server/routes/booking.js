const router = require("express").Router();
const ctrl = require("../controllers/booking.controller");

// CREATE BOOKING
router.post("/create", ctrl.createBooking);

// GET HOST RESERVATIONS
router.get("/host/:hostId", ctrl.getHostReservations);

// ACCEPT BOOKING
router.patch("/:bookingId/accept", ctrl.acceptBooking);

// REJECT BOOKING
router.patch("/:bookingId/reject", ctrl.rejectBooking);

// CHECKOUT BOOKING
router.patch("/:bookingId/checkout", ctrl.checkoutBooking);

// REQUEST EXTENSION
router.post("/:bookingId/extension", ctrl.requestExtension);

// APPROVE EXTENSION
router.patch("/:bookingId/extension/:extensionIndex/approve", ctrl.approveExtension);

// REJECT EXTENSION
router.patch("/:bookingId/extension/:extensionIndex/reject", ctrl.rejectExtension);

// CANCEL BOOKING
router.patch("/:bookingId/cancel", ctrl.cancelBooking);

// GET BOOKING BY ID
router.get("/:bookingId", ctrl.getBookingById);

// RECORD REMAINING PAYMENT
router.post("/:bookingId/record-payment", ctrl.recordPayment);

module.exports = router;
