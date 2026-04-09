const Listing = require("../models/Listing");
const Booking = require("../models/Booking");

const createListing = async (data, files) => {
  if (!files || files.length === 0) {
    const error = new Error("At least one listing photo is required");
    error.statusCode = 400;
    throw error;
  }

  const listingPhotoPaths = files.map((file) => file.path);
  
  const newListing = new Listing({
    ...data,
    listingPhotoPaths
  });

  const validationError = newListing.validateSync();
  if (validationError) {
    const error = new Error("Validation error: " + validationError.message);
    error.statusCode = 400;
    error.details = validationError.errors;
    throw error;
  }

  return await newListing.save();
};

const getListings = async (category) => {
  let query = { isActive: true };
  if (category) {
    query.category = category;
  }

  const listings = await Listing.find(query).populate("creator");
  
  const availableListings = await Promise.all(
    listings.map(async (listing) => {
      const activeBooking = await Booking.findOne({
        listingId: listing._id,
        status: { $in: ["pending", "accepted"] },
        isCheckedOut: false,
      });
      return activeBooking ? null : listing;
    })
  );

  return availableListings.filter((l) => l !== null);
};

const getListingById = async (id) => {
  return await Listing.findById(id).populate("creator");
};

const updateListing = async (id, updateData, files) => {
  const existingListing = await Listing.findById(id);
  if (!existingListing) {
    const error = new Error("Listing not found");
    error.statusCode = 404;
    throw error;
  }

  let finalUpdateData = { ...updateData };
  // Fallback defaults
  if (!finalUpdateData.amenities) {
      finalUpdateData.amenities = [];
  } else if (!Array.isArray(finalUpdateData.amenities)) {
      finalUpdateData.amenities = [finalUpdateData.amenities];
  }

  if (files && files.length > 0) {
    const newPhotoPaths = files.map((file) => file.path);
    finalUpdateData.listingPhotoPaths = [
      ...existingListing.listingPhotoPaths,
      ...newPhotoPaths,
    ];
  }

  return await Listing.findByIdAndUpdate(id, finalUpdateData, {
    new: true,
    runValidators: true,
  });
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing
};
