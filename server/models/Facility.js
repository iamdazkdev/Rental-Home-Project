const mongoose = require("mongoose");

/**
 * Facility Schema
 * Manages property facilities/amenities (Wifi, Kitchen, Pool, etc.)
 */
const FacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String, // Icon name
      required: true,
    },
    category: {
      type: String,
      enum: ["basic", "bathroom", "kitchen", "safety", "outdoor", "entertainment", "other"],
      default: "other",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
FacilitySchema.index({ isActive: 1, category: 1, displayOrder: 1 });

// Static methods
FacilitySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ category: 1, displayOrder: 1 });
};

FacilitySchema.statics.getByCategory = function(category) {
  return this.find({ isActive: true, category }).sort({ displayOrder: 1 });
};

FacilitySchema.statics.getAll = function() {
  return this.find().sort({ category: 1, displayOrder: 1 });
};

const Facility = mongoose.model("Facility", FacilitySchema);

module.exports = Facility;

