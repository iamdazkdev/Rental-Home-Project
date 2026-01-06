const mongoose = require("mongoose");

/**
 * UserFacility Schema
 * User-specific facilities
 */
const UserFacilitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
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
    isCustom: {
      type: Boolean,
      default: false,
    },
    forkedFromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index
UserFacilitySchema.index({ userId: 1, name: 1 }, { unique: true });
UserFacilitySchema.index({ userId: 1, isActive: 1, category: 1, displayOrder: 1 });

// Static methods
UserFacilitySchema.statics.getByUser = function(userId, activeOnly = false, category = null) {
  const query = { userId };
  if (activeOnly) query.isActive = true;
  if (category) query.category = category;
  return this.find(query).sort({ category: 1, displayOrder: 1 });
};

UserFacilitySchema.statics.createFromGlobal = async function(userId, globalFacilityId) {
  const Facility = mongoose.model("Facility");
  const globalFacility = await Facility.findById(globalFacilityId);

  if (!globalFacility) throw new Error("Global facility not found");

  return this.create({
    userId,
    name: globalFacility.name,
    icon: globalFacility.icon,
    category: globalFacility.category,
    displayOrder: globalFacility.displayOrder,
    isCustom: false,
    forkedFromId: globalFacility._id,
    isActive: true,
  });
};

const UserFacility = mongoose.model("UserFacility", UserFacilitySchema);

module.exports = UserFacility;

