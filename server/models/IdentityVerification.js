const mongoose = require("mongoose");

const IdentityVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One verification per user
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    idCardFront: {
      type: String, // Cloudinary URL
      required: true,
    },
    idCardBack: {
      type: String, // Cloudinary URL
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who reviewed
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
IdentityVerificationSchema.index({ userId: 1 });
IdentityVerificationSchema.index({ status: 1 });

const IdentityVerification = mongoose.model(
  "IdentityVerification",
  IdentityVerificationSchema
);

module.exports = IdentityVerification;

