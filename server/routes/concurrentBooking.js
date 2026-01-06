/**
 * Concurrent Booking Routes
 *
 * API endpoints for handling concurrent booking with locking mechanism
 */

const express = require("express");
const router = express.Router();
const {
  checkListingAvailability,
  createBookingIntent,
  getBookingIntent,
  getBookingIntentByTempOrderId,
  confirmPaymentAndCreateBooking,
  cancelBookingIntent,
  getUserActiveIntent,
  extendIntentLock,
} = require("../services/concurrentBookingService");

/**
 * Check listing availability
 * GET /concurrent-booking/availability/:listingId
 */
router.get("/availability/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const availability = await checkListingAvailability(listingId, startDate, endDate);

    res.json({
      success: true,
      available: availability.available,
      reason: availability.reason,
      message: availability.available
        ? "Listing is available for the selected dates"
        : availability.reason === "LISTING_ALREADY_BOOKED"
          ? "This listing is already booked for the selected dates"
          : "This listing is currently being reserved by another user",
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check availability",
      error: error.message,
    });
  }
});

/**
 * Create a booking intent (lock the listing)
 * POST /concurrent-booking/intent
 */
router.post("/intent", async (req, res) => {
  try {
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
      depositPercentage,
      depositAmount,
      remainingAmount,
      bookingType,
      lockDurationMinutes,
    } = req.body;

    // Validate required fields
    if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if user already has an active intent for this listing
    const existingIntent = await getUserActiveIntent(customerId, listingId);
    if (existingIntent) {
      return res.json({
        success: true,
        message: "You already have an active reservation for this listing",
        intent: existingIntent,
        intentId: existingIntent.intentId,
        tempOrderId: existingIntent.tempOrderId,
        expiresAt: existingIntent.expiresAt,
        isExisting: true,
      });
    }

    const result = await createBookingIntent(
      {
        customerId,
        hostId,
        listingId,
        startDate,
        endDate,
        totalPrice,
        paymentMethod: paymentMethod || "vnpay",
        paymentType: paymentType || "full",
        paymentAmount: paymentAmount || totalPrice,
        depositPercentage: depositPercentage || 0,
        depositAmount: depositAmount || 0,
        remainingAmount: remainingAmount || 0,
        bookingType: bookingType || "entire_place",
      },
      lockDurationMinutes
    );

    if (!result.success) {
      return res.status(409).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating booking intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking intent",
      error: error.message,
    });
  }
});

/**
 * Get booking intent by ID
 * GET /concurrent-booking/intent/:intentId
 */
router.get("/intent/:intentId", async (req, res) => {
  try {
    const { intentId } = req.params;
    const intent = await getBookingIntent(intentId);

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: "Booking intent not found",
      });
    }

    res.json({
      success: true,
      intent,
    });
  } catch (error) {
    console.error("Error getting booking intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get booking intent",
      error: error.message,
    });
  }
});

/**
 * Get booking intent by temp order ID (for VNPay callback)
 * GET /concurrent-booking/intent/temp/:tempOrderId
 */
router.get("/intent/temp/:tempOrderId", async (req, res) => {
  try {
    const { tempOrderId } = req.params;
    const intent = await getBookingIntentByTempOrderId(tempOrderId);

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: "Booking intent not found",
      });
    }

    res.json({
      success: true,
      intent,
    });
  } catch (error) {
    console.error("Error getting booking intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get booking intent",
      error: error.message,
    });
  }
});

/**
 * Confirm payment and create booking
 * POST /concurrent-booking/confirm/:intentId
 */
router.post("/confirm/:intentId", async (req, res) => {
  try {
    const { intentId } = req.params;
    const { transactionId } = req.body;

    const result = await confirmPaymentAndCreateBooking(intentId, transactionId);

    if (!result.success) {
      const statusCode = result.error === "INTENT_NOT_FOUND" ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    res.json({
      success: true,
      message: "Booking confirmed successfully",
      booking: result.booking,
      intent: result.intent,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
});

/**
 * Cancel booking intent (release lock)
 * DELETE /concurrent-booking/intent/:intentId
 */
router.delete("/intent/:intentId", async (req, res) => {
  try {
    const { intentId } = req.params;
    const { reason } = req.body;

    const result = await cancelBookingIntent(intentId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: "Booking intent cancelled successfully",
      intent: result.intent,
    });
  } catch (error) {
    console.error("Error cancelling booking intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking intent",
      error: error.message,
    });
  }
});

/**
 * Extend intent lock duration
 * PUT /concurrent-booking/intent/:intentId/extend
 */
router.put("/intent/:intentId/extend", async (req, res) => {
  try {
    const { intentId } = req.params;
    const { additionalMinutes } = req.body;

    const result = await extendIntentLock(intentId, additionalMinutes || 5);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: "Lock extended successfully",
      newExpiresAt: result.newExpiresAt,
      intent: result.intent,
    });
  } catch (error) {
    console.error("Error extending intent lock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extend lock",
      error: error.message,
    });
  }
});

/**
 * Get user's active intent for a listing
 * GET /concurrent-booking/user/:customerId/listing/:listingId
 */
router.get("/user/:customerId/listing/:listingId", async (req, res) => {
  try {
    const { customerId, listingId } = req.params;
    const intent = await getUserActiveIntent(customerId, listingId);

    res.json({
      success: true,
      hasActiveIntent: intent !== null,
      intent: intent,
    });
  } catch (error) {
    console.error("Error getting user active intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user active intent",
      error: error.message,
    });
  }
});

module.exports = router;

