const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        // Booking lifecycle
        "booking_request",
        "booking_accepted",
        "booking_approved",
        "booking_rejected",
        "booking_cancelled",
        "booking_checked_in",
        "booking_checked_out",
        "booking_completed",
        "booking_auto_checked_out",

        // Extension requests
        "extension_request",
        "extension_approved",
        "extension_rejected",

        // Reviews
        "new_review",
        "review_submitted",
        "review_request",

        // Payments
        "payment_received",
        "payment_refunded",
        "payment_reminder",
        "payment_confirmed",

        // Messages
        "new_message",

        // General
        "system_notification",
      ],
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;

