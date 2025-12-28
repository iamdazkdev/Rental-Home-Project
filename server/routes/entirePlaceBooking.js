const router = require('express').Router();
const Booking = require('../models/Booking');
const PendingBooking = require('../models/PendingBooking');
const bookingService = require('../services/bookingService');
const vnpayService = require('../services/vnpayService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Check availability for dates
 * GET /booking/check-availability
 */
router.get('/check-availability', async (req, res) => {
  try {
    const { listingId, startDate, endDate } = req.query;

    if (!listingId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Missing required parameters: listingId, startDate, endDate'
      });
    }

    const result = await bookingService.checkAvailability(listingId, startDate, endDate);

    res.json(result);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Failed to check availability', error: error.message });
  }
});

/**
 * Create booking from payment success
 * POST /booking/create-from-payment
 */
router.post('/create-from-payment', authenticateToken, async (req, res) => {
  try {
    const { tempOrderId, transactionId, paymentData } = req.body;

    if (!tempOrderId) {
      return res.status(400).json({ message: 'Missing tempOrderId' });
    }

    // Verify VNPay signature
    const isValid = vnpayService.verifyReturnUrl(paymentData);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Check payment response code
    if (paymentData.vnp_ResponseCode !== '00') {
      return res.status(400).json({ message: 'Payment failed or cancelled' });
    }

    const booking = await bookingService.createBookingFromPayment(
      tempOrderId,
      transactionId || paymentData.vnp_TransactionNo,
      paymentData
    );

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking from payment:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

/**
 * Create cash booking
 * POST /booking/create-cash
 */
router.post('/create-cash', authenticateToken, async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      customerId: req.user.id
    };

    const booking = await bookingService.createCashBooking(bookingData);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating cash booking:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

/**
 * Get user's bookings
 * GET /booking/user/:userId
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, role } = req.query;

    // Verify user can only access their own bookings
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let query = {};

    if (role === 'host') {
      query.hostId = userId;
    } else {
      query.customerId = userId;
    }

    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'firstName lastName email profileImagePath')
      .populate('hostId', 'firstName lastName email profileImagePath')
      .populate('listingId')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

/**
 * Get booking by ID
 * GET /booking/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'firstName lastName email profileImagePath phone')
      .populate('hostId', 'firstName lastName email profileImagePath phone')
      .populate('listingId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user is part of this booking
    const userId = req.user.id;
    if (
      booking.customerId._id.toString() !== userId &&
      booking.hostId._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
  }
});

/**
 * Host approves booking
 * PATCH /booking/:id/approve
 */
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const booking = await bookingService.approveBooking(req.params.id, req.user.id);

    res.json(booking);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Failed to approve booking', error: error.message });
  }
});

/**
 * Host rejects booking
 * PATCH /booking/:id/reject
 */
router.patch('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await bookingService.rejectBooking(
      req.params.id,
      req.user.id,
      reason
    );

    res.json(booking);
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'Failed to reject booking', error: error.message });
  }
});

/**
 * Guest cancels booking
 * PATCH /booking/:id/cancel
 */
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await bookingService.cancelBooking(
      req.params.id,
      req.user.id,
      reason
    );

    res.json(result);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

/**
 * Guest checks in
 * PATCH /booking/:id/check-in
 */
router.patch('/:id/check-in', authenticateToken, async (req, res) => {
  try {
    const booking = await bookingService.checkIn(req.params.id, req.user.id);

    res.json(booking);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ message: 'Failed to check in', error: error.message });
  }
});

/**
 * Guest checks out
 * PATCH /booking/:id/check-out
 */
router.patch('/:id/check-out', authenticateToken, async (req, res) => {
  try {
    const booking = await bookingService.checkOut(req.params.id, req.user.id);

    res.json(booking);
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ message: 'Failed to check out', error: error.message });
  }
});

/**
 * Host confirms cash payment received
 * POST /booking/:id/confirm-cash-payment
 */
router.post('/:id/confirm-cash-payment', authenticateToken, async (req, res) => {
  try {
    const { amount, notes } = req.body;

    const booking = await bookingService.confirmCashPayment(
      req.params.id,
      req.user.id,
      amount,
      notes
    );

    res.json(booking);
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment', error: error.message });
  }
});

/**
 * Host completes booking
 * PATCH /booking/:id/complete
 */
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { hasDamage, damageReport } = req.body;

    const booking = await bookingService.completeBooking(
      req.params.id,
      req.user.id,
      hasDamage,
      damageReport
    );

    res.json(booking);
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ message: 'Failed to complete booking', error: error.message });
  }
});

/**
 * Request booking extension
 * POST /booking/:id/extend
 */
router.post('/:id/extend', authenticateToken, async (req, res) => {
  try {
    const { newEndDate, additionalNights } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.status !== 'checked_in') {
      return res.status(400).json({ message: 'Can only extend active bookings' });
    }

    // Check availability for extension
    const listing = await Listing.findById(booking.listingId);
    const additionalPrice = additionalNights * listing.price;

    // Add extension request
    booking.extensionRequests.push({
      requestedEndDate: newEndDate,
      additionalDays: additionalNights,
      additionalPrice,
      status: 'pending',
      requestedAt: new Date()
    });

    await booking.save();

    // Notify host
    const notificationService = require('../services/notificationService');
    await notificationService.sendExtensionRequest(booking);

    res.json(booking);
  } catch (error) {
    console.error('Error requesting extension:', error);
    res.status(500).json({ message: 'Failed to request extension', error: error.message });
  }
});

/**
 * Host approves extension
 * PATCH /booking/:id/extension/:extensionId/approve
 */
router.patch('/:id/extension/:extensionId/approve', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.hostId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const extension = booking.extensionRequests.id(req.params.extensionId);

    if (!extension) {
      return res.status(404).json({ message: 'Extension request not found' });
    }

    extension.status = 'approved';
    extension.approvedAt = new Date();

    await booking.save();

    // Notify guest to pay for extension
    const notificationService = require('../services/notificationService');
    await notificationService.sendExtensionApproved(booking, extension);

    res.json(booking);
  } catch (error) {
    console.error('Error approving extension:', error);
    res.status(500).json({ message: 'Failed to approve extension', error: error.message });
  }
});

/**
 * Host rejects extension
 * PATCH /booking/:id/extension/:extensionId/reject
 */
router.patch('/:id/extension/:extensionId/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.hostId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const extension = booking.extensionRequests.id(req.params.extensionId);

    if (!extension) {
      return res.status(404).json({ message: 'Extension request not found' });
    }

    extension.status = 'rejected';
    extension.rejectedAt = new Date();
    extension.rejectionReason = reason;

    await booking.save();

    // Notify guest
    const notificationService = require('../services/notificationService');
    await notificationService.sendExtensionRejected(booking, extension, reason);

    res.json(booking);
  } catch (error) {
    console.error('Error rejecting extension:', error);
    res.status(500).json({ message: 'Failed to reject extension', error: error.message });
  }
});

module.exports = router;

