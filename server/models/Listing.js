const mongoose = require("mongoose");
const ListingSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    aptSuite: {
      type: String,
      required: false, // Optional - not all properties have apt/suite numbers
      default: "",
    },
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
    guestCount: {
      type: Number,
      required: true,
    },
    bedroomCount: {
      type: Number,
      required: true,
    },
    bathroomCount: {
      type: Number,
      required: true,
    },
    bedCount: {
      type: Number,
      required: true,
    },
    amenities: {
      type: Array,
      default: [],
      required: true,
    },
    listingPhotoPaths: [
      {
        type: String, // Store file paths as strings
      },
    ],
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    highlight: {
      type: String,
      required: true,
    },
    highlightDesc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    monthlyPrice: {
      type: Number,
    },
    pricingType: {
      type: String,
      enum: ["daily", "monthly"],
    },
    hostProfile: {
      sleepSchedule: String,
      smoking: String,
      personality: String,
      cleanliness: String,
      occupation: String,
      hobbies: String,
      houseRules: String,
      additionalInfo: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;
