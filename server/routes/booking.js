const router = require("express").Router();
const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Review = require("../models/Review");
const { HTTP_STATUS } = require("../constants");

// Helper function to create notification
const createNotification = async (userId, type, bookingId, message, link = "") => {
  try {
    const notification = new Notification({
      userId,
      type,
      bookingId,
      message,
      link,
    });
    await notification.save();
    console.log(`✅ Notification created for user ${userId}: ${type}`);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
};

// Helper function to calculate extension price (30% of daily rate)
const calculateExtensionPrice = (listingPrice, additionalDays) => {
  const dailyRate = listingPrice; // Assuming listingPrice is daily rate
  const extensionRate = dailyRate * 1.3; // 30% surcharge
  return extensionRate * additionalDays;
};

// CREATE BOOKING
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice } = req.body;

    // Validate required fields
    if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Missing required fields",
      });
    }

    // Check if user already has an active booking for this listing
    const existingBooking = await Booking.findOne({
      customerId,
      listingId,
      status: { $in: ["pending", "accepted"] },
      isCheckedOut: false,
    });

    if (existingBooking) {
      console.log(`⚠️ Duplicate booking attempt prevented for listing ${listingId} by user ${customerId}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "You already have an active booking for this listing",
        existingBooking,
      });
    }

    // Get listing details for notification
    const listing = await Listing.findById(listingId);
    const customer = await User.findById(customerId);

    // Create booking with pending status
    const newBooking = new Booking({
      customerId,
      hostId,
      listingId,
      startDate,
      endDate,
      totalPrice,
      status: "pending",
      finalEndDate: endDate,
      finalTotalPrice: totalPrice,
      // Set payment fields for cash booking
      paymentMethod: req.body.paymentMethod || "cash",
      paymentStatus: "unpaid",
      remainingAmount: totalPrice,
      remainingDueDate: new Date(startDate), // Due at check-in
      // Initialize empty payment history
      paymentHistory: [],
    });

    const savedBooking = await newBooking.save();

    // Create notification for host
    await createNotification(
      hostId,
      "booking_request",
      savedBooking._id,
      `${customer.firstName} ${customer.lastName} has requested to book "${listing.title}" from ${startDate} to ${endDate}`,
      `/reservations`
    );

    console.log(`✅ Booking created: ${savedBooking._id} - Status: pending`);

    res.status(HTTP_STATUS.OK).json(savedBooking);
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
});

// GET HOST RESERVATIONS (bookings for host's properties)
router.get("/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const reservations = await Booking.find({ hostId })
      .populate("customerId", "firstName lastName email profileImagePath")
      .populate("listingId", "title listingPhotoPaths city province country price")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${reservations.length} reservations for host ${hostId}`);

    res.status(HTTP_STATUS.OK).json(reservations);
  } catch (error) {
    console.error("❌ Error fetching host reservations:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
});

// ACCEPT BOOKING
router.patch("/:bookingId/accept", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Cannot accept booking with status: ${booking.status}`,
      });
    }

    // Update booking status
    booking.status = "accepted";
    await booking.save();

    // Create notification for customer
    await createNotification(
      booking.customerId._id,
      "booking_accepted",
      booking._id,
      `Your booking request for "${booking.listingId.title}" has been accepted! 🎉`,
      `/${booking.customerId._id}/trips`
    );

    console.log(`✅ Booking ${bookingId} accepted`);

    res.status(HTTP_STATUS.OK).json({
      message: "Booking accepted successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error accepting booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to accept booking",
      error: error.message,
    });
  }
});

// REJECT BOOKING
router.patch("/:bookingId/reject", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Cannot reject booking with status: ${booking.status}`,
      });
    }

    // Update booking status
    booking.status = "rejected";
    booking.rejectionReason = reason || "No reason provided";
    await booking.save();

    // Create notification for customer
    await createNotification(
      booking.customerId._id,
      "booking_rejected",
      booking._id,
      `Your booking request for "${booking.listingId.title}" has been rejected. Reason: ${booking.rejectionReason}`,
      `/${booking.customerId._id}/trips`
    );

    console.log(`✅ Booking ${bookingId} rejected`);

    res.status(HTTP_STATUS.OK).json({
      message: "Booking rejected successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error rejecting booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reject booking",
      error: error.message,
    });
  }
});

// CHECKOUT BOOKING (manual checkout)
router.patch("/:bookingId/checkout", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Cannot checkout booking with status: ${booking.status}`,
      });
    }

    // Update booking status
    booking.status = "checked_out";
    booking.isCheckedOut = true;
    booking.checkedOutAt = new Date();
    await booking.save();

    // Create notification for customer
    await createNotification(
      booking.customerId._id,
      "booking_checked_out",
      booking._id,
      `You have successfully checked out from "${booking.listingId.title}". Please leave a review!`,
      `/${booking.customerId._id}/trips`
    );

    console.log(`✅ Booking ${bookingId} checked out`);

    res.status(HTTP_STATUS.OK).json({
      message: "Checkout successful",
      booking,
    });
  } catch (error) {
    console.error("❌ Error checking out:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to checkout",
      error: error.message,
    });
  }
});

// REQUEST EXTENSION
router.post("/:bookingId/extension", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { additionalDays } = req.body;

    if (!additionalDays || additionalDays < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Additional days must be at least 1",
      });
    }

    const booking = await Booking.findById(bookingId).populate("listingId", "price");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Cannot request extension for booking with status: ${booking.status}`,
      });
    }

    // Calculate extension price (30% surcharge)
    const additionalPrice = calculateExtensionPrice(booking.listingId.price, additionalDays);

    // Calculate new end date
    const currentEndDate = new Date(booking.finalEndDate || booking.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);
    const requestedEndDate = newEndDate.toISOString().split('T')[0];

    // Add extension request
    const extensionRequest = {
      requestedEndDate,
      additionalDays,
      additionalPrice,
      status: "pending",
    };

    booking.extensionRequests.push(extensionRequest);
    await booking.save();

    // Create notification for host
    const customer = await User.findById(booking.customerId);
    await createNotification(
      booking.hostId,
      "extension_request",
      booking._id,
      `${customer.firstName} ${customer.lastName} has requested to extend their stay by ${additionalDays} days (+$${additionalPrice})`,
      `/reservations`
    );

    console.log(`✅ Extension request created for booking ${bookingId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Extension request submitted successfully",
      extensionRequest,
    });
  } catch (error) {
    console.error("❌ Error requesting extension:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to request extension",
      error: error.message,
    });
  }
});

// APPROVE EXTENSION
router.patch("/:bookingId/extension/:extensionIndex/approve", async (req, res) => {
  try {
    const { bookingId, extensionIndex } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    const extension = booking.extensionRequests[extensionIndex];
    if (!extension) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Extension request not found",
      });
    }

    if (extension.status !== "pending") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Extension request is already ${extension.status}`,
      });
    }

    // Approve extension
    extension.status = "approved";
    extension.approvedAt = new Date();

    // Update booking dates and price
    booking.finalEndDate = extension.requestedEndDate;
    booking.finalTotalPrice = (booking.finalTotalPrice || booking.totalPrice) + extension.additionalPrice;

    await booking.save();

    // Create notification for customer
    await createNotification(
      booking.customerId._id,
      "extension_approved",
      booking._id,
      `Your extension request for "${booking.listingId.title}" has been approved! New checkout: ${extension.requestedEndDate}`,
      `/${booking.customerId._id}/trips`
    );

    console.log(`✅ Extension approved for booking ${bookingId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Extension approved successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error approving extension:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to approve extension",
      error: error.message,
    });
  }
});

// REJECT EXTENSION
router.patch("/:bookingId/extension/:extensionIndex/reject", async (req, res) => {
  try {
    const { bookingId, extensionIndex } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    const extension = booking.extensionRequests[extensionIndex];
    if (!extension) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Extension request not found",
      });
    }

    if (extension.status !== "pending") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Extension request is already ${extension.status}`,
      });
    }

    // Reject extension
    extension.status = "rejected";
    extension.rejectedAt = new Date();
    extension.rejectionReason = reason || "No reason provided";

    await booking.save();

    // Create notification for customer
    await createNotification(
      booking.customerId._id,
      "extension_rejected",
      booking._id,
      `Your extension request for "${booking.listingId.title}" has been rejected. Reason: ${extension.rejectionReason}`,
      `/${booking.customerId._id}/trips`
    );

    console.log(`✅ Extension rejected for booking ${bookingId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Extension rejected successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error rejecting extension:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reject extension",
      error: error.message,
    });
  }
});

// CANCEL BOOKING (Guest can cancel pending bookings)
router.patch("/:bookingId/cancel", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { customerId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("hostId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    // Verify the user is the customer
    if (booking.customerId._id.toString() !== customerId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "You are not authorized to cancel this booking",
      });
    }

    // Only allow cancellation of pending bookings
    if (booking.status !== "pending") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Cannot cancel booking with status: ${booking.status}. Only pending bookings can be cancelled.`,
      });
    }

    // Update booking status to cancelled
    booking.status = "cancelled";
    await booking.save();

    // Create notification for host
    await createNotification(
      booking.hostId._id,
      "booking_cancelled",
      booking._id,
      `${booking.customerId.firstName} ${booking.customerId.lastName} has cancelled their booking request for "${booking.listingId.title}"`,
      `/reservations`
    );

    console.log(`✅ Booking ${bookingId} cancelled by guest ${customerId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
});

// GET BOOKING BY ID
router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName email profileImagePath")
      .populate("hostId", "firstName lastName email")
      .populate("listingId");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    res.status(HTTP_STATUS.OK).json(booking);
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
});

// RECORD REMAINING PAYMENT
// For host to mark remaining payment as received
router.post("/:bookingId/record-payment", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, method, notes } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid payment amount",
      });
    }

    // Add payment to history
    const paymentEntry = {
      amount: amount,
      method: method || "cash",
      status: "paid",
      transactionId: `MANUAL_${Date.now()}`,
      type: "remaining",
      paidAt: new Date(),
      notes: notes || "Remaining payment received at check-in",
    };

    booking.paymentHistory.push(paymentEntry);

    // Update remaining amount
    const newRemainingAmount = Math.max(0, booking.remainingAmount - amount);
    booking.remainingAmount = newRemainingAmount;

    // Update payment status
    if (newRemainingAmount === 0) {
      booking.paymentStatus = "paid";
    }

    await booking.save();

    console.log(`✅ Payment recorded for booking ${bookingId}: ${amount} VND via ${method}`);

    // DUAL-WRITE: Save to standalone PaymentHistory collection
    try {
      const paymentHistoryDoc = new PaymentHistory({
        bookingId: booking._id,
        customerId: booking.customerId,
        hostId: booking.hostId,
        listingId: booking.listingId,
        amount: amount,
        method: method || "cash",
        status: "paid",
        transactionId: paymentEntry.transactionId,
        type: "remaining",
        paidAt: new Date(),
        notes: notes || "Remaining payment received at check-in",
        recordedBy: booking.hostId, // Host recorded this payment
      });

      await paymentHistoryDoc.save();
      console.log(`✅ Payment history saved to standalone collection: ${paymentHistoryDoc._id}`);
    } catch (historyError) {
      console.error("⚠️ Failed to save to PaymentHistory collection (non-critical):", historyError);
      // Don't fail the booking if history save fails
    }

    res.status(HTTP_STATUS.OK).json({
      message: "Payment recorded successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error recording payment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to record payment",
      error: error.message,
    });
  }
});

module.exports = router;
