const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    // Review for listing
    listingRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    listingComment: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    // Review for host (if reviewer is guest)
    hostRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    hostComment: {
      type: String,
      maxlength: 500,
      default: "",
    },
    // Review for guest (if reviewer is host)
    guestRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    guestComment: {
      type: String,
      maxlength: 500,
      default: "",
    },
    reviewType: {
      type: String,
      enum: ["guest_to_listing", "guest_to_host", "host_to_guest"],
      required: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
ReviewSchema.index({ listingId: 1, createdAt: -1 });
ReviewSchema.index({ bookingId: 1 });
ReviewSchema.index({ reviewerId: 1 });

const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;
