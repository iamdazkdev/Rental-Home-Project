const mongoose = require("mongoose");

/**
 * UserPropertyType Schema
 * User-specific property types
 */
const UserPropertyTypeSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: true,
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
    isCustom: {
      type: Boolean,
      default: false,
    },
    forkedFromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyType",
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
UserPropertyTypeSchema.index({ userId: 1, name: 1 }, { unique: true });
UserPropertyTypeSchema.index({ userId: 1, isActive: 1, displayOrder: 1 });

// Static methods
UserPropertyTypeSchema.statics.getByUser = function(userId, activeOnly = false) {
  const query = { userId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort({ displayOrder: 1 });
};

UserPropertyTypeSchema.statics.createFromGlobal = async function(userId, globalTypeId) {
  const PropertyType = mongoose.model("PropertyType");
  const globalType = await PropertyType.findById(globalTypeId);

  if (!globalType) throw new Error("Global property type not found");

  return this.create({
    userId,
    name: globalType.name,
    description: globalType.description,
    icon: globalType.icon,
    displayOrder: globalType.displayOrder,
    isCustom: false,
    forkedFromId: globalType._id,
    isActive: true,
  });
};

const UserPropertyType = mongoose.model("UserPropertyType", UserPropertyTypeSchema);

module.exports = UserPropertyType;

