const mongoose = require("mongoose");

/**
 * UserCategory Schema
 * User-specific categories - each user can customize their own categories
 */
const UserCategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Category details
    label: {
      type: String,
      required: true,
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
      type: String,
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
    // Track if this is a custom category or forked from global
    isCustom: {
      type: Boolean,
      default: false,
    },
    forkedFromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index: userId + label must be unique per user
UserCategorySchema.index({ userId: 1, label: 1 }, { unique: true });
UserCategorySchema.index({ userId: 1, isActive: 1, displayOrder: 1 });

// Static methods
UserCategorySchema.statics.getByUser = function(userId, activeOnly = false) {
  const query = { userId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort({ displayOrder: 1 });
};

UserCategorySchema.statics.createFromGlobal = async function(userId, globalCategoryId) {
  const Category = mongoose.model("Category");
  const globalCategory = await Category.findById(globalCategoryId);

  if (!globalCategory) throw new Error("Global category not found");

  return this.create({
    userId,
    label: globalCategory.label,
    description: globalCategory.description,
    img: globalCategory.img,
    icon: globalCategory.icon,
    displayOrder: globalCategory.displayOrder,
    isCustom: false,
    forkedFromId: globalCategory._id,
    isActive: true,
  });
};

const UserCategory = mongoose.model("UserCategory", UserCategorySchema);

module.exports = UserCategory;

