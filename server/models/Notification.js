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
        // Booking lifecycle (Entire Place - Process 1)
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

        // Room Rental (Process 2)
        "rental_request",
        "rental_accepted",
        "rental_approved",
        "rental_rejected",
        "rental_cancelled",
        "rental_agreement_created",
        "rental_agreement_signed",
        "rental_agreement_confirmed",
        "rental_agreement_active",
        "rental_agreement_tenant_accepted",
        "rental_move_in",
        "rental_move_in_confirmed",
        "rental_move_out",
        "rental_payment_due",
        "rental_payment_received",
        "rental_payment_confirmed",
        "rental_terminated",
        "rental_termination_request",

        // Roommate matching (Process 3)
        "roommate_request",
        "roommate_accepted",
        "roommate_rejected",
        "roommate_matched",

        // General
        "system_notification",
      ],
      required: true,
    },
    // For Entire Place bookings (Process 1)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false, // Made optional for Room Rental & Roommate notifications
    },
    // For Room Rental (Process 2)
    rentalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalRequest",
      required: false,
    },
    // For Roommate (Process 3)
    roommatePostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoommatePost",
      required: false,
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

