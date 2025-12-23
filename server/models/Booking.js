const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "checked_out", "completed"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    // Checkout fields
    checkedOutAt: {
      type: Date,
      default: null,
    },
    isCheckedOut: {
      type: Boolean,
      default: false,
    },
    // Extension requests
    extensionRequests: [
      {
        requestedEndDate: String,
        additionalDays: Number,
        additionalPrice: Number,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        approvedAt: Date,
        rejectedAt: Date,
        rejectionReason: String,
      },
    ],
    // Final dates after extensions
    finalEndDate: {
      type: String,
      default: null,
    },
    finalTotalPrice: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
