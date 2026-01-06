/**
 * Concurrent Booking Service
 *
 * Handles concurrent booking requests to prevent:
 * - Overbooking
 * - Double payment
 * - Data inconsistency
 *
 * Implements temporary reservation (locking) mechanism using BookingIntent
 */

const mongoose = require("mongoose");
const BookingIntent = require("../models/BookingIntent");
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const crypto = require("crypto");

// Lock duration in minutes
const DEFAULT_LOCK_DURATION = 10; // 10 minutes

/**
 * Generate unique intent ID
 */
const generateIntentId = () => {
  return `INTENT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
};

/**
 * Check if listing is available for the given date range
 * This checks both confirmed bookings and active locks
 */
const checkListingAvailability = async (listingId, startDate, endDate, excludeIntentId = null) => {
  const result = {
    available: true,
    reason: null,
    conflictingBooking: null,
    conflictingIntent: null,
  };

  try {
    // 1. Check for confirmed bookings that overlap
    const conflictingBooking = await Booking.findOne({
      listingId: listingId,
      bookingStatus: { $in: ["pending", "approved", "checked_in"] },
      $or: [
        // Date ranges overlap
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (conflictingBooking) {
      result.available = false;
      result.reason = "LISTING_ALREADY_BOOKED";
      result.conflictingBooking = conflictingBooking;
      return result;
    }

    // 2. Check for active booking intents (locks)
    const query = {
      listingId: listingId,
      status: "locked",
      expiresAt: { $gt: new Date() },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    };

    // Exclude current intent if provided (for re-checking own intent)
    if (excludeIntentId) {
      query.intentId = { $ne: excludeIntentId };
    }

    const conflictingIntent = await BookingIntent.findOne(query);

    if (conflictingIntent) {
      result.available = false;
      result.reason = "LISTING_TEMPORARILY_RESERVED";
      result.conflictingIntent = conflictingIntent;
      return result;
    }

    return result;
  } catch (error) {
    console.error("Error checking listing availability:", error);
    throw error;
  }
};

/**
 * Create a booking intent (temporary lock)
 * This is the first step in the booking process
 */
const createBookingIntent = async (bookingData, lockDurationMinutes = DEFAULT_LOCK_DURATION) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      customerId,
      hostId,
      listingId,
      startDate,
      endDate,
      totalPrice,
      paymentMethod,
      paymentType,
      paymentAmount,
      depositPercentage = 0,
      depositAmount = 0,
      remainingAmount = 0,
      bookingType = "entire_place",
    } = bookingData;

    // 1. Check availability (within transaction for consistency)
    const availability = await checkListingAvailability(listingId, startDate, endDate);

    if (!availability.available) {
      await session.abortTransaction();
      return {
        success: false,
        error: availability.reason,
        message: availability.reason === "LISTING_ALREADY_BOOKED"
          ? "This listing is already booked for the selected dates"
          : "This listing is currently being reserved by another user. Please try again in a few minutes.",
        conflictingIntent: availability.conflictingIntent,
      };
    }

    // 2. Create the booking intent with lock
    const intentId = generateIntentId();
    const tempOrderId = `${paymentType.toUpperCase()}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + lockDurationMinutes * 60 * 1000);

    const intent = new BookingIntent({
      intentId,
      tempOrderId,
      customerId,
      hostId,
      listingId,
      bookingType,
      startDate,
      endDate,
      totalPrice,
      status: "locked",
      paymentMethod,
      paymentType,
      paymentAmount,
      depositPercentage,
      depositAmount,
      remainingAmount,
      lockedAt: new Date(),
      expiresAt,
    });

    await intent.save({ session });
    await session.commitTransaction();

    console.log(`✅ Booking intent created: ${intentId} for listing ${listingId}`);
    console.log(`   Lock expires at: ${expiresAt.toISOString()}`);

    return {
      success: true,
      intent,
      intentId,
      tempOrderId,
      expiresAt,
      lockDurationMinutes,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error creating booking intent:", error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return {
        success: false,
        error: "CONCURRENT_REQUEST",
        message: "Another booking request is being processed. Please try again.",
      };
    }

    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get booking intent by ID
 */
const getBookingIntent = async (intentId) => {
  return await BookingIntent.findOne({ intentId });
};

/**
 * Get booking intent by temp order ID (for VNPay callback)
 */
const getBookingIntentByTempOrderId = async (tempOrderId) => {
  return await BookingIntent.findOne({ tempOrderId });
};

/**
 * Confirm payment and create booking
 * This is called after successful payment
 */
const confirmPaymentAndCreateBooking = async (intentId, transactionId = null) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Find and validate the intent
    const intent = await BookingIntent.findOne({ intentId }).session(session);

    if (!intent) {
      await session.abortTransaction();
      return {
        success: false,
        error: "INTENT_NOT_FOUND",
        message: "Booking intent not found",
      };
    }

    if (intent.status !== "locked") {
      await session.abortTransaction();
      return {
        success: false,
        error: "INVALID_INTENT_STATUS",
        message: `Intent has already been processed (status: ${intent.status})`,
      };
    }

    if (new Date() > intent.expiresAt) {
      intent.status = "expired";
      intent.failureReason = "Lock expired before payment confirmation";
      await intent.save({ session });
      await session.abortTransaction();
      return {
        success: false,
        error: "INTENT_EXPIRED",
        message: "Your reservation has expired. Please start a new booking.",
      };
    }

    // 2. Double-check availability (in case of edge cases)
    const availability = await checkListingAvailability(
      intent.listingId,
      intent.startDate,
      intent.endDate,
      intent.intentId
    );

    if (!availability.available) {
      intent.status = "failed";
      intent.failureReason = "Listing became unavailable during payment";
      await intent.save({ session });
      await session.abortTransaction();
      return {
        success: false,
        error: "LISTING_UNAVAILABLE",
        message: "Sorry, this listing is no longer available for the selected dates.",
      };
    }

    // 3. Create the actual booking
    const bookingData = {
      customerId: intent.customerId,
      hostId: intent.hostId,
      listingId: intent.listingId,
      startDate: intent.startDate,
      endDate: intent.endDate,
      totalPrice: intent.totalPrice,
      finalTotalPrice: intent.totalPrice,
      paymentMethod: intent.paymentMethod,
      paymentType: intent.paymentType,
      depositPercentage: intent.depositPercentage,
      depositAmount: intent.depositAmount,
      remainingAmount: intent.remainingAmount,
      paidAmount: intent.paymentAmount,
      transactionId: transactionId,
      paidAt: new Date(),
    };

    // Set booking status based on payment type
    if (intent.paymentMethod === "cash") {
      bookingData.bookingStatus = "pending";
      bookingData.paymentStatus = "unpaid";
    } else if (intent.paymentType === "full") {
      bookingData.bookingStatus = "approved"; // Auto-approve for full payment
      bookingData.paymentStatus = "paid";
      bookingData.approvedAt = new Date();
    } else if (intent.paymentType === "deposit") {
      bookingData.bookingStatus = "pending";
      bookingData.paymentStatus = "partially_paid";
    }

    const booking = new Booking(bookingData);
    await booking.save({ session });

    // 4. Update the intent
    intent.status = "paid";
    intent.paidAt = new Date();
    intent.transactionId = transactionId;
    intent.bookingId = booking._id;
    await intent.save({ session });

    await session.commitTransaction();

    console.log(`✅ Booking created from intent: ${intentId} -> Booking ${booking._id}`);

    return {
      success: true,
      booking,
      intent,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error confirming payment:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel a booking intent
 */
const cancelBookingIntent = async (intentId, reason = "User cancelled") => {
  try {
    const intent = await BookingIntent.findOne({ intentId });

    if (!intent) {
      return {
        success: false,
        error: "INTENT_NOT_FOUND",
        message: "Booking intent not found",
      };
    }

    if (intent.status !== "locked") {
      return {
        success: false,
        error: "INVALID_STATUS",
        message: `Cannot cancel intent with status: ${intent.status}`,
      };
    }

    intent.status = "cancelled";
    intent.failureReason = reason;
    await intent.save();

    console.log(`✅ Booking intent cancelled: ${intentId}`);

    return {
      success: true,
      intent,
    };
  } catch (error) {
    console.error("❌ Error cancelling booking intent:", error);
    throw error;
  }
};

/**
 * Release expired booking intents
 * This should be called periodically by a background job
 */
const releaseExpiredIntents = async () => {
  try {
    const count = await BookingIntent.releaseExpiredLocks();
    if (count > 0) {
      console.log(`🔓 Released ${count} expired booking intent(s)`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error releasing expired intents:", error);
    throw error;
  }
};

/**
 * Get user's active booking intent for a listing
 */
const getUserActiveIntent = async (customerId, listingId) => {
  return await BookingIntent.findOne({
    customerId,
    listingId,
    status: "locked",
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Extend lock duration for an intent
 */
const extendIntentLock = async (intentId, additionalMinutes = 5) => {
  try {
    const intent = await BookingIntent.findOne({ intentId });

    if (!intent || intent.status !== "locked") {
      return {
        success: false,
        error: "INVALID_INTENT",
        message: "Cannot extend lock for this intent",
      };
    }

    // Max extension is 30 minutes total from original lock
    const maxExpiresAt = new Date(intent.lockedAt.getTime() + 30 * 60 * 1000);
    const newExpiresAt = new Date(Math.min(
      intent.expiresAt.getTime() + additionalMinutes * 60 * 1000,
      maxExpiresAt.getTime()
    ));

    intent.expiresAt = newExpiresAt;
    await intent.save();

    return {
      success: true,
      intent,
      newExpiresAt,
    };
  } catch (error) {
    console.error("❌ Error extending intent lock:", error);
    throw error;
  }
};

module.exports = {
  checkListingAvailability,
  createBookingIntent,
  getBookingIntent,
  getBookingIntentByTempOrderId,
  confirmPaymentAndCreateBooking,
  cancelBookingIntent,
  releaseExpiredIntents,
  getUserActiveIntent,
  extendIntentLock,
  generateIntentId,
  DEFAULT_LOCK_DURATION,
};

