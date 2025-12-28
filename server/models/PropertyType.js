const mongoose = require("mongoose");

/**
 * PropertyType Schema
 * Manages property types (An entire place, Room(s), A Shared Room)
 */
const PropertyTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String, // Icon name
      required: true,
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
PropertyTypeSchema.index({ isActive: 1, displayOrder: 1 });

// Static methods
PropertyTypeSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

PropertyTypeSchema.statics.getAll = function() {
  return this.find().sort({ displayOrder: 1 });
};

const PropertyType = mongoose.model("PropertyType", PropertyTypeSchema);

module.exports = PropertyType;

