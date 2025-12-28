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
      required: false, // Optional - not required for Room Rental
    },
    highlightDesc: {
      type: String,
      required: false, // Optional - not required for Room Rental
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
    // Room Rental specific fields
    monthlyRent: {
      type: Number, // Primary rent for Room Rental (monthly)
    },
    depositAmount: {
      type: Number, // Security deposit (usually 1 month rent)
    },
    roomArea: {
      type: Number, // Room area in square meters (m²)
    },
    hostBio: {
      type: String, // Host introduction for Room Rental
    },
    rentalType: {
      type: String,
      enum: ["NIGHTLY", "MONTHLY"], // NIGHTLY = Entire Place, MONTHLY = Room Rental
      default: "NIGHTLY",
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
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'flexible',
    },
  },
  { timestamps: true }
);
const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;
