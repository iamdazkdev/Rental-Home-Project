const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImagePath: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    hostBio: {
      type: String,
      default: "",
    },
    tripList: {
      type: Array,
      default: [],
    },
    wishList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
    ],
    propertyList: {
      type: Array,
      default: [],
    },
    reservationList: {
      type: Array,
      default: [],
    },
    // Lifestyle Profile for Room Rental (Process 2)
    lifestyleProfile: {
      sleepSchedule: {
        type: String,
        enum: ["early_bird", "normal", "night_owl"],
      },
      smoking: {
        type: String,
        enum: ["yes", "no", "occasionally"],
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5, // 1 = messy, 5 = very clean
      },
      noiseTolerance: {
        type: String,
        enum: ["very_quiet", "quiet", "moderate", "tolerant", "very_tolerant"],
      },
      guestPolicy: {
        type: String,
        enum: ["no_guests", "rare", "occasional", "frequent", "very_frequent"],
      },
      pets: {
        type: String,
        enum: ["yes", "no", "has_pets", "allowed", "allergic"],
      },
      personality: {
        type: String,
        enum: [
          "very_introverted",
          "introverted",
          "balanced",
          "extroverted",
          "very_extroverted",
        ],
      },
      occupation: {
        type: String,
      },
      hobbies: {
        type: String,
      },
    },
  },
  { timestamps: true }
);
const User = mongoose.model("User", UserSchema);
module.exports = User;
