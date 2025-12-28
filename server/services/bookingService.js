const Booking = require('../models/Booking');
const BookingIntent = require('../models/BookingIntent');
const PendingBooking = require('../models/PendingBooking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const PaymentHistory = require('../models/PaymentHistory');
const notificationService = require('./notificationService');
const vnpayService = require('./vnpayService');

/**
 * Booking Service for Entire Place Rental (v2.0)
 * Handles booking lifecycle with separated booking/payment status
 */
class BookingService {

  /**
   * Check availability for given dates (v2.0)
   */
  async checkAvailability(listingId, startDate, endDate) {
    try {
      // Find overlapping bookings (v2.0 - use bookingStatus)
      const conflicts = await Booking.find({
        listingId,
        $or: [
          // v2.0 field
          { bookingStatus: { $in: ['pending', 'approved', 'checked_in'] } },
          // Backward compatibility
          { status: { $in: ['pending', 'approved', 'accepted', 'checked_in'] } }
        ],
        $and: [
          {
            $or: [
              // Start date falls within existing booking
              { startDate: { $lte: startDate }, endDate: { $gte: startDate } },
              // End date falls within existing booking
              { startDate: { $lte: endDate }, endDate: { $gte: endDate } },
              // New booking encompasses existing booking
              { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
            ]
          }
        ]
      });

      if (conflicts.length > 0) {
        return {
          available: false,
          conflicts: conflicts.map(b => ({
            start: b.startDate,
            end: b.endDate,
            bookingId: b._id,
            status: b.bookingStatus || b.status
          }))
        };
      }

      // Calculate pricing
      const listing = await Listing.findById(listingId);
      const nights = this.calculateNights(startDate, endDate);
      const subtotal = nights * listing.price;
      const serviceFee = subtotal * 0.10; // 10% platform fee
      const tax = subtotal * 0.05; // 5% tax
      const total = subtotal + serviceFee + tax;

      return {
        available: true,
        conflicts: [],
        pricing: {
          nights,
          pricePerNight: listing.price,
          subtotal,
          serviceFee,
          tax,
          total
        }
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Create BookingIntent (v2.0) - Temporary record before VNPay redirect
   */
  async createBookingIntent(bookingData, paymentType) {
    try {
      const { listingId, customerId, hostId, startDate, endDate, totalPrice } = bookingData;

      // Check availability first
      const availability = await this.checkAvailability(listingId, startDate, endDate);
      if (!availability.available) {
        throw new Error('Dates not available');
      }

      // Calculate payment amount based on type
      let paymentAmount = totalPrice;
      let depositAmount = 0;
      let depositPercentage = 0;
      let remainingAmount = 0;

      if (paymentType === 'deposit') {
        depositPercentage = 30; // 30% deposit
        depositAmount = Math.round(totalPrice * 0.30);
        paymentAmount = depositAmount;
        remainingAmount = totalPrice - depositAmount;
      }

      // Generate unique tempOrderId
      const tempOrderId = `INTENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create BookingIntent (expires in 30 minutes)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const bookingIntent = new BookingIntent({
        tempOrderId,
        customerId,
        hostId,
        listingId,
        startDate,
        endDate,
        totalPrice,
        paymentMethod: 'vnpay',
        paymentType,
        paymentAmount,
        depositPercentage,
        depositAmount,
        remainingAmount,
        expiresAt
      });

      await bookingIntent.save();

      console.log(`✅ BookingIntent created: ${tempOrderId}, type: ${paymentType}, amount: ${paymentAmount}`);

      return {
        tempOrderId,
        paymentAmount,
        bookingIntent
      };
    } catch (error) {
      console.error('❌ Error creating BookingIntent:', error);
      throw error;
    }
  }

  /**
   * Create booking from successful payment (v2.0)
   */
  async createBookingFromPayment(tempOrderId, transactionId, paymentData) {
    try {
      // Find BookingIntent (v2.0) - NOT PendingBooking
      const bookingIntent = await BookingIntent.findOne({ tempOrderId });

      if (!bookingIntent) {
        // Fallback: try old PendingBooking for backward compatibility
        const pendingBooking = await PendingBooking.findOne({ tempOrderId });

        if (!pendingBooking) {
          throw new Error('BookingIntent not found or expired');
        }

        // Use old flow for backward compatibility
        return this.createBookingFromPendingBooking(pendingBooking, transactionId, paymentData);
      }

      // Verify payment amount matches
      const expectedAmount = bookingIntent.paymentAmount;
      const paidAmount = parseInt(paymentData.vnp_Amount) / 100; // VNPay sends in cents

      if (Math.abs(paidAmount - expectedAmount) > 1) { // Allow 1 VND difference for rounding
        throw new Error(`Payment amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);
      }

      // Determine payment status based on payment type
      let paymentStatus = 'unpaid';
      let paidAmountValue = paidAmount;

      if (bookingIntent.paymentType === 'full') {
        paymentStatus = 'paid';
      } else if (bookingIntent.paymentType === 'deposit') {
        paymentStatus = 'partially_paid';
        paidAmountValue = bookingIntent.depositAmount;
      }

      // Create actual Booking (v2.0)
      const booking = new Booking({
        customerId: bookingIntent.customerId,
        hostId: bookingIntent.hostId,
        listingId: bookingIntent.listingId,
        startDate: bookingIntent.startDate,
        endDate: bookingIntent.endDate,
        totalPrice: bookingIntent.totalPrice,

        // v2.0 fields
        bookingStatus: 'pending', // Waiting for host approval
        paymentStatus,
        paymentMethod: 'vnpay',
        paymentType: bookingIntent.paymentType,

        depositAmount: bookingIntent.depositAmount || 0,
        depositPercentage: bookingIntent.depositPercentage || 0,
        remainingAmount: bookingIntent.remainingAmount || 0,
        paidAmount: paidAmountValue,

        paymentIntentId: tempOrderId,
        transactionId,
        paidAt: new Date(),

        // Backward compatibility
        status: 'pending',

        paymentHistory: [{
          amount: paidAmount,
          method: 'vnpay',
          status: 'paid',
          transactionId,
          type: bookingIntent.paymentType === 'full' ? 'full' : 'deposit',
          paidAt: new Date()
        }]
      });

      await booking.save();

      // Create payment history record
      await PaymentHistory.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        hostId: booking.hostId,
        listingId: booking.listingId,
        amount: paidAmount,
        paymentMethod: 'vnpay',
        paymentType: bookingIntent.paymentType === 'full' ? 'full_payment' : 'deposit',
        transactionId,
        status: 'completed',
        description: `VNPay ${bookingIntent.paymentType} payment for booking ${booking._id}`
      });

      // Delete BookingIntent after successful conversion
      await BookingIntent.findByIdAndDelete(bookingIntent._id);

      console.log(`✅ Booking created from payment: ${booking._id}, bookingStatus: ${booking.bookingStatus}, paymentStatus: ${booking.paymentStatus}`);

      // Notify host about new booking request
      await notificationService.sendBookingRequest(booking);

      // Populate booking data
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email profileImagePath' },
        { path: 'hostId', select: 'firstName lastName email profileImagePath' },
        { path: 'listingId' }
      ]);

      return booking;
    } catch (error) {
      console.error('❌ Error creating booking from payment:', error);
      throw error;
    }
  }

  /**
   * Create booking from successful payment (OLD - DEPRECATED)
   */
  async createBookingFromPendingBooking(pendingBooking, transactionId, paymentData) {
    try {
      // Find pending booking
      const pendingBooking = await PendingBooking.findOne({ tempOrderId });

      if (!pendingBooking) {
        throw new Error('Pending booking not found or expired');
      }

      // Verify payment amount matches
      const expectedAmount = pendingBooking.paymentAmount;
      const paidAmount = parseInt(paymentData.vnp_Amount) / 100; // VNPay sends in cents

      if (paidAmount !== expectedAmount) {
        throw new Error('Payment amount mismatch');
      }

      // Determine payment status
      let paymentStatus = 'unpaid';
      let depositAmount = 0;
      let remainingAmount = 0;
      let paymentType = 'full';

      if (pendingBooking.paymentMethod === 'vnpay_full') {
        paymentStatus = 'paid';
        paymentType = 'full';
      } else if (pendingBooking.paymentMethod === 'vnpay_deposit') {
        paymentStatus = 'partially_paid';
        paymentType = 'deposit';
        depositAmount = pendingBooking.depositAmount;
        remainingAmount = pendingBooking.totalPrice - depositAmount;
      }

      // Map payment method to valid enum value
      const paymentMethod = pendingBooking.paymentMethod === 'cash' ? 'cash' : 'vnpay';

      // Create actual booking
      const booking = new Booking({
        customerId: pendingBooking.customerId,
        hostId: pendingBooking.hostId,
        listingId: pendingBooking.listingId,
        startDate: pendingBooking.startDate,
        endDate: pendingBooking.endDate,
        totalPrice: pendingBooking.totalPrice,
        paymentMethod: paymentMethod, // ✅ FIXED: Use mapped value
        paymentType: paymentType, // ✅ FIXED: Add required field
        paymentStatus,
        depositAmount,
        depositPercentage: pendingBooking.depositPercentage,
        remainingAmount,
        paymentIntentId: transactionId,
        paidAt: new Date(),
        status: 'pending', // Waiting for host approval
        paymentHistory: [{
          amount: paidAmount,
          method: paymentMethod, // ✅ Use mapped value
          status: 'paid',
          transactionId,
          type: paymentType, // ✅ Use paymentType
          paidAt: new Date()
        }]
      });

      await booking.save();

      // Create payment history record
      await PaymentHistory.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        hostId: booking.hostId,
        listingId: booking.listingId,
        amount: paidAmount,
        paymentMethod: 'vnpay',
        paymentType: pendingBooking.paymentMethod === 'vnpay_full' ? 'full_payment' : 'deposit',
        transactionId,
        status: 'completed',
        description: `Payment for booking ${booking._id}`
      });

      // Delete pending booking
      await PendingBooking.findByIdAndDelete(pendingBooking._id);

      // Notify host
      await notificationService.sendBookingRequest(booking);

      // Populate booking data
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email profileImagePath' },
        { path: 'hostId', select: 'firstName lastName email profileImagePath' },
        { path: 'listingId' }
      ]);

      return booking;
    } catch (error) {
      console.error('Error creating booking from payment:', error);
      throw error;
    }
  }

  /**
   * Create cash booking (v2.0) - No payment yet
   */
  async createCashBooking(bookingData) {
    try {
      const { listingId, customerId, hostId, startDate, endDate, totalPrice } = bookingData;

      // Check availability first
      const availability = await this.checkAvailability(listingId, startDate, endDate);

      if (!availability.available) {
        throw new Error('Dates not available');
      }

      // Create booking with unpaid status (v2.0)
      const booking = new Booking({
        customerId,
        hostId,
        listingId,
        startDate,
        endDate,
        totalPrice,

        // v2.0 fields
        bookingStatus: 'pending', // Waiting for host approval
        paymentStatus: 'unpaid',  // No payment yet
        paymentMethod: 'cash',
        paymentType: 'cash',

        remainingAmount: totalPrice,
        paidAmount: 0,

        // Backward compatibility
        status: 'pending'
      });

      await booking.save();

      console.log(`✅ Cash booking created: ${booking._id}, bookingStatus: ${booking.bookingStatus}, paymentStatus: ${booking.paymentStatus}`);

      // Notify host about cash booking request (clearly marked as cash)
      await notificationService.sendBookingRequest(booking);

      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email profileImagePath' },
        { path: 'hostId', select: 'firstName lastName email profileImagePath' },
        { path: 'listingId' }
      ]);

      return booking;
    } catch (error) {
      console.error('❌ Error creating cash booking:', error);
      throw error;
    }
  }

  /**
   * Host approves booking (v2.0)
   */
  async approveBooking(bookingId, hostId) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.hostId.toString() !== hostId) {
        throw new Error('Unauthorized - not the property owner');
      }

      // Check bookingStatus (v2.0)
      const currentStatus = booking.bookingStatus || booking.status;
      if (currentStatus !== 'pending') {
        throw new Error('Booking is not in pending status');
      }

      // Update to approved (v2.0)
      booking.bookingStatus = 'approved';
      booking.status = 'approved'; // Backward compatibility
      booking.approvedAt = new Date();

      await booking.save();

      console.log(`✅ Booking approved: ${booking._id}, paymentType: ${booking.paymentType}, paymentStatus: ${booking.paymentStatus}`);

      // Notify guest
      await notificationService.sendBookingApproved(booking);

      // Payment handling based on type (v2.0):
      // - FULL payment: Keep in escrow until check-in
      // - DEPOSIT: Lock in escrow until remaining cash paid
      // - CASH: No action needed, wait for check-in payment

      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email profileImagePath' },
        { path: 'listingId' }
      ]);

      return booking;
    } catch (error) {
      console.error('❌ Error approving booking:', error);
      throw error;
    }
  }

  /**
   * Host rejects booking (v2.0)
   */
  async rejectBooking(bookingId, hostId, reason) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.hostId.toString() !== hostId) {
        throw new Error('Unauthorized');
      }

      const currentStatus = booking.bookingStatus || booking.status;
      if (currentStatus !== 'pending') {
        throw new Error('Booking is not in pending status');
      }

      // Update to rejected (v2.0)
      booking.bookingStatus = 'rejected';
      booking.status = 'rejected'; // Backward compatibility
      booking.rejectionReason = reason;

      await booking.save();

      console.log(`✅ Booking rejected: ${booking._id}, paymentStatus: ${booking.paymentStatus}`);

      // Process refund if paid (v2.0)
      if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'partially_paid') {
        await this.processRefund(booking, 'host_rejection');
      }

      // Notify guest
      await notificationService.sendBookingRejected(booking, reason);

      return booking;
    } catch (error) {
      console.error('❌ Error rejecting booking:', error);
      throw error;
    }
  }

  /**
   * Guest cancels booking
   */
  async cancelBooking(bookingId, customerId, reason) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.customerId.toString() !== customerId) {
        throw new Error('Unauthorized');
      }

      if (!['pending', 'approved'].includes(booking.status)) {
        throw new Error('Cannot cancel booking in current status');
      }

      booking.status = 'cancelled';
      booking.cancellationReason = reason;
      await booking.save();

      // Calculate refund based on cancellation policy
      const refundAmount = await this.calculateCancellationRefund(booking);

      if (refundAmount > 0) {
        await this.processRefund(booking, 'guest_cancellation', refundAmount);
      }

      // Notify host
      await notificationService.sendBookingCancelled(booking);

      return { booking, refundAmount };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Guest checks in
   */
  async checkIn(bookingId, customerId) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.customerId.toString() !== customerId) {
        throw new Error('Unauthorized');
      }

      if (booking.status !== 'approved') {
        throw new Error('Booking must be approved first');
      }

      booking.status = 'checked_in';
      booking.checkedInAt = new Date();
      await booking.save();

      // If VNPay full payment, release to host now
      if (booking.paymentMethod === 'vnpay_full' && booking.paymentStatus === 'paid') {
        await this.releasePaymentToHost(booking);
      }

      // Notify host
      await notificationService.sendGuestCheckedIn(booking);

      return booking;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  /**
   * Guest checks out
   */
  async checkOut(bookingId, customerId) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.customerId.toString() !== customerId) {
        throw new Error('Unauthorized');
      }

      if (booking.status !== 'checked_in') {
        throw new Error('Must be checked in first');
      }

      booking.status = 'checked_out';
      booking.checkedOutAt = new Date();
      booking.isCheckedOut = true;
      await booking.save();

      // Notify host to inspect property
      await notificationService.sendGuestCheckedOut(booking);

      return booking;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  /**
   * Complete booking
   */
  async completeBooking(bookingId, hostId, hasDamage = false, damageReport = null) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.hostId.toString() !== hostId) {
        throw new Error('Unauthorized');
      }

      if (booking.status !== 'checked_out') {
        throw new Error('Guest must check out first');
      }

      if (hasDamage) {
        booking.status = 'dispute';
        booking.damageReport = damageReport;
        // Initiate dispute process
      } else {
        booking.status = 'completed';
      }

      await booking.save();

      // Request reviews from both parties
      await notificationService.requestReviews(booking);

      return booking;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  }

  /**
   * Confirm cash payment received (v2.0)
   * For cash bookings or remaining amount for deposit bookings
   */
  async confirmCashPayment(bookingId, hostId, paymentDetails) {
    try {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.hostId.toString() !== hostId) {
        throw new Error('Unauthorized - not the property owner');
      }

      const { amount, notes } = paymentDetails;

      // Update payment status
      if (booking.paymentStatus === 'unpaid') {
        // Cash booking - full payment received
        booking.paymentStatus = 'paid';
        booking.paidAmount = amount || booking.totalPrice;
        booking.remainingAmount = 0;

      } else if (booking.paymentStatus === 'partially_paid') {
        // Deposit booking - remaining payment received
        booking.paymentStatus = 'paid';
        booking.paidAmount = booking.totalPrice;
        booking.remainingAmount = 0;
      }

      booking.paidAt = new Date();

      // Add to payment history
      booking.paymentHistory.push({
        amount: amount || booking.remainingAmount,
        method: 'cash',
        status: 'paid',
        type: booking.paymentType === 'deposit' ? 'remaining' : 'full',
        paidAt: new Date(),
        notes: notes || 'Cash payment confirmed by host'
      });

      await booking.save();

      // Create payment history record
      await PaymentHistory.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        hostId: booking.hostId,
        listingId: booking.listingId,
        amount: amount || booking.remainingAmount,
        paymentMethod: 'cash',
        paymentType: booking.paymentType === 'deposit' ? 'remaining_payment' : 'full_payment',
        status: 'completed',
        description: notes || `Cash payment confirmed for booking ${booking._id}`
      });

      console.log(`✅ Cash payment confirmed: ${booking._id}, amount: ${amount}, paymentStatus: ${booking.paymentStatus}`);

      // If deposit was paid, now release it to host
      if (booking.paymentType === 'deposit' && booking.depositAmount > 0) {
        console.log(`💰 Releasing deposit to host: ${booking.depositAmount} VND`);
        // In production: actual payment processing here
      }

      // Notify guest
      await notificationService.sendPaymentConfirmed(booking);

      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email profileImagePath' },
        { path: 'listingId' }
      ]);

      return booking;
    } catch (error) {
      console.error('❌ Error confirming cash payment:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate nights between dates
   */
  calculateNights(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Helper: Calculate refund based on cancellation policy
   */
  async calculateCancellationRefund(booking) {
    const now = new Date();
    const checkInDate = new Date(booking.startDate);
    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));

    // Get listing's cancellation policy
    const listing = await Listing.findById(booking.listingId);
    const policy = listing.cancellationPolicy || 'flexible';

    let refundPercentage = 0;

    switch (policy) {
      case 'flexible':
        if (daysUntilCheckIn > 7) refundPercentage = 100;
        else if (daysUntilCheckIn >= 3) refundPercentage = 50;
        else refundPercentage = 0;
        break;

      case 'moderate':
        if (daysUntilCheckIn > 14) refundPercentage = 100;
        else if (daysUntilCheckIn >= 7) refundPercentage = 50;
        else refundPercentage = 0;
        break;

      case 'strict':
        if (daysUntilCheckIn > 30) refundPercentage = 100;
        else if (daysUntilCheckIn >= 14) refundPercentage = 50;
        else refundPercentage = 0;
        break;
    }

    // Calculate based on amount paid
    const paidAmount = booking.paymentHistory
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    return (paidAmount * refundPercentage) / 100;
  }

  /**
   * Helper: Process refund
   */
  async processRefund(booking, reason, amount = null) {
    try {
      const refundAmount = amount || booking.totalPrice;

      // Only process VNPay refunds
      if (booking.paymentMethod.includes('vnpay')) {
        // In real implementation, call VNPay refund API
        console.log(`Processing refund of ${refundAmount} for booking ${booking._id}`);

        // Update payment history
        booking.paymentHistory.push({
          amount: refundAmount,
          method: 'vnpay',
          status: 'refunded',
          type: 'refund',
          paidAt: new Date(),
          notes: reason
        });

        booking.paymentStatus = 'refunded';
        await booking.save();

        // Create payment history record
        await PaymentHistory.create({
          bookingId: booking._id,
          customerId: booking.customerId,
          hostId: booking.hostId,
          listingId: booking.listingId,
          amount: -refundAmount, // Negative for refund
          paymentMethod: 'vnpay',
          paymentType: 'refund',
          status: 'completed',
          description: `Refund for ${reason}`
        });
      }

      return refundAmount;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Helper: Release payment to host
   */
  async releasePaymentToHost(booking) {
    try {
      // Platform takes 10% fee
      const platformFee = booking.totalPrice * 0.10;
      const hostAmount = booking.totalPrice - platformFee;

      console.log(`Releasing ${hostAmount} to host for booking ${booking._id}`);
      console.log(`Platform fee: ${platformFee}`);

      // In real implementation, transfer to host's account
      // For now, just log and create payment history

      await PaymentHistory.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        hostId: booking.hostId,
        listingId: booking.listingId,
        amount: hostAmount,
        paymentMethod: 'vnpay',
        paymentType: 'host_payout',
        status: 'completed',
        description: `Payout to host (after 10% platform fee)`
      });

      // Notify host
      await notificationService.sendPaymentReleased(booking, hostAmount);

      return hostAmount;
    } catch (error) {
      console.error('Error releasing payment to host:', error);
      throw error;
    }
  }
}

module.exports = new BookingService();

