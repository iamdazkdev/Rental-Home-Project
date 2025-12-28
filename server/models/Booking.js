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
    // BOOKING STATUS (v2.0) - Lifecycle of the booking
    bookingStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "checked_in", "checked_out", "completed", "cancelled", "rejected", "expired"],
      default: "pending",
    },
    // PAYMENT STATUS (v2.0) - Financial state (separate from booking)
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "refunded"],
      default: "unpaid",
    },
    // DEPRECATED: Keep for backward compatibility, will be removed
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "checked_out", "completed"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    cancellationReason: {
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
    // Payment fields (v2.0)
    paymentMethod: {
      type: String,
      enum: ["vnpay", "cash"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["full", "deposit", "cash"],
      required: true,
    },
    depositPercentage: {
      type: Number,
      default: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    checkInAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Payment History - Track all payment transactions
    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true,
        },
        method: {
          type: String,
          enum: ["vnpay", "cash", "bank_transfer"],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "failed", "refunded"],
          default: "paid",
        },
        transactionId: {
          type: String,
          default: null,
        },
        type: {
          type: String,
          enum: ["deposit", "partial", "full", "remaining"],
          required: true,
        },
        paidAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
    // Remaining due date tracking
    remainingDueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
