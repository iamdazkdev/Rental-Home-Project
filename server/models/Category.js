const mongoose = require("mongoose");

/**
 * Category Schema
 * Manages property categories (Beachfront, Countryside, Luxury, etc.)
 */
const CategorySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    img: {
      type: String,
      default: null,
    },
    icon: {
      type: String, // Will store icon name instead of React component
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
CategorySchema.index({ label: 1 });
CategorySchema.index({ isActive: 1, displayOrder: 1 });

// Static methods
CategorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

CategorySchema.statics.getAll = function() {
  return this.find().sort({ displayOrder: 1 });
};

const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;

