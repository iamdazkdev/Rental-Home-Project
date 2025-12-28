const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

// Auto-checkout expired bookings
const autoCheckoutExpiredBookings = async () => {
  try {
    console.log("🔄 Starting auto-checkout process...");

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find approved/checked_in bookings that have ended and not yet checked out
    const expiredBookings = await Booking.find({
      bookingStatus: { $in: ["approved", "checked_in"] },
      isCheckedOut: false,
      $or: [
        { finalEndDate: { $lt: currentDate } },
        { endDate: { $lt: currentDate } }
      ]
    }).populate("customerId", "firstName lastName").populate("listingId", "title");

    console.log(`📋 Found ${expiredBookings.length} expired bookings to checkout`);

    for (const booking of expiredBookings) {
      try {
        // Update booking status
        booking.bookingStatus = "checked_out";
        booking.isCheckedOut = true;
        booking.checkOutAt = now;
        await booking.save();

        // Create notification for customer
        await createNotification(
          booking.customerId._id,
          "booking_auto_checked_out",
          booking._id,
          `Your stay at "${booking.listingId.title}" has ended. Please leave a review!`,
          `/${booking.customerId._id}/trips`
        );

        console.log(`✅ Auto-checked out booking ${booking._id}`);
      } catch (error) {
        console.error(`❌ Error auto-checking out booking ${booking._id}:`, error);
      }
    }

    console.log("✅ Auto-checkout process completed");
  } catch (error) {
    console.error("❌ Error in auto-checkout process:", error);
  }
};

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

// Run if called directly
if (require.main === module) {
  // Connect to database
  const dotenv = require("dotenv").config();
  const DB_NAME = process.env.DB_NAME;

  mongoose
    .connect(process.env.MONGO_URL, { dbName: DB_NAME })
    .then(async () => {
      console.log("Connected to database for auto-checkout");
      await autoCheckoutExpiredBookings();
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database connection error:", error);
      process.exit(1);
    });
}

module.exports = { autoCheckoutExpiredBookings };
