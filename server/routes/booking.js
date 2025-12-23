const router = require("express").Router();
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Listing = require("../models/Listing");
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
      .populate("listingId", "title listingPhotoPaths city province country")
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

module.exports = router;
