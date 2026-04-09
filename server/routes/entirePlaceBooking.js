const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  createIntentSchema,
  checkAvailabilitySchema,
  createFromPaymentSchema,
  cashBookingSchema,
  extendSchema,
  reasonSchema,
  confirmCashPaymentSchema,
  completeSchema,
  extensionActionSchema,
  getUserBookingsSchema
} = require('../validators/booking.validator');
const bookingController = require('../controllers/booking.controller');

// ==========================================
// CLEAN ROUTER - ENTIRE PLACE BOOKING
// ==========================================

// Intents & Availability
router.post('/create-intent', authenticateToken, validate(createIntentSchema), asyncHandler(bookingController.createIntent));
router.get('/check-availability', validate(checkAvailabilitySchema), asyncHandler(bookingController.checkAvailability));
router.post('/create-from-payment', authenticateToken, validate(createFromPaymentSchema), asyncHandler(bookingController.createFromPayment));
router.post('/create-cash', authenticateToken, validate(cashBookingSchema), asyncHandler(bookingController.createCashBooking));

// Booking Fetching
router.get('/user/:userId', authenticateToken, validate(getUserBookingsSchema), asyncHandler(bookingController.getUserBookings));
router.get('/:id', authenticateToken, asyncHandler(bookingController.getBookingById));

// Host & Guest Actions
router.patch('/:id/approve', authenticateToken, asyncHandler(bookingController.approveBooking));
router.patch('/:id/reject', authenticateToken, validate(reasonSchema), asyncHandler(bookingController.rejectBooking));
router.patch('/:id/cancel', authenticateToken, validate(reasonSchema), asyncHandler(bookingController.cancelBooking));
router.patch('/:id/check-in', authenticateToken, asyncHandler(bookingController.checkIn));
router.patch('/:id/check-out', authenticateToken, asyncHandler(bookingController.checkOut));
router.post('/:id/confirm-cash-payment', authenticateToken, validate(confirmCashPaymentSchema), asyncHandler(bookingController.confirmCashPayment));
router.patch('/:id/complete', authenticateToken, validate(completeSchema), asyncHandler(bookingController.completeBooking));

// Extension Requests
router.post('/:id/extend', authenticateToken, validate(extendSchema), asyncHandler(bookingController.extendBooking));
router.patch('/:id/extension/:extensionId/approve', authenticateToken, validate(extensionActionSchema), asyncHandler(bookingController.approveExtension));
router.patch('/:id/extension/:extensionId/reject', authenticateToken, validate(extensionActionSchema), asyncHandler(bookingController.rejectExtension));

module.exports = router;
