const mongoose = require("mongoose");

const RoommatePostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postType: {
      type: String,
      enum: ["SEEKER", "PROVIDER"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Location
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    // Budget
    budgetMin: {
      type: Number,
      required: true,
      min: 0,
    },
    budgetMax: {
      type: Number,
      required: true,
      min: 0,
    },
    // Move-in date
    moveInDate: {
      type: Date,
      required: true,
    },
    // Preferences
    genderPreference: {
      type: String,
      enum: ["MALE", "FEMALE", "ANY"],
      default: "ANY",
    },
    ageRangeMin: {
      type: Number,
      min: 18,
      max: 100,
    },
    ageRangeMax: {
      type: Number,
      min: 18,
      max: 100,
    },
    // Lifestyle
    lifestyle: {
      sleepSchedule: {
        type: String,
        enum: ["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"],
        default: "FLEXIBLE",
      },
      smoking: {
        type: String,
        enum: ["YES", "NO", "OUTSIDE_ONLY"],
        default: "NO",
      },
      pets: {
        type: String,
        enum: ["YES", "NO", "NEGOTIABLE"],
        default: "NEGOTIABLE",
      },
      cleanliness: {
        type: String,
        enum: ["VERY_CLEAN", "MODERATE", "RELAXED"],
        default: "MODERATE",
      },
      occupation: {
        type: String,
        enum: ["STUDENT", "PROFESSIONAL", "FREELANCER", "OTHER"],
      },
    },
    // Contact preferences
    preferredContact: {
      type: String,
      enum: ["CHAT", "PHONE", "EMAIL"],
      default: "CHAT",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    // Images (optional)
    images: [String],
    // Status
    status: {
      type: String,
      enum: ["ACTIVE", "MATCHED", "CLOSED"],
      default: "ACTIVE",
      index: true,
    },
    // Match info
    matchedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    matchedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    // Stats
    viewCount: {
      type: Number,
      default: 0,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search performance
RoommatePostSchema.index({ status: 1, city: 1 });
RoommatePostSchema.index({ status: 1, budgetMin: 1, budgetMax: 1 });
RoommatePostSchema.index({ status: 1, moveInDate: 1 });
RoommatePostSchema.index({ userId: 1, status: 1 });

// Validate budget range
RoommatePostSchema.pre("save", function (next) {
  if (this.budgetMax < this.budgetMin) {
    return next(new Error("budgetMax must be greater than or equal to budgetMin"));
  }
  if (this.ageRangeMax && this.ageRangeMin && this.ageRangeMax < this.ageRangeMin) {
    return next(new Error("ageRangeMax must be greater than or equal to ageRangeMin"));
  }
  next();
});

const RoommatePost = mongoose.model("RoommatePost", RoommatePostSchema);

module.exports = RoommatePost;

