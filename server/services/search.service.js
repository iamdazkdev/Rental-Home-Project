const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

const executeSearch = async (filters) => {
  const {
    query,
    city,
    province,
    country,
    category,
    type,
    minPrice,
    maxPrice,
    minGuests,
    minBedrooms,
    minBathrooms,
    amenities,
    minRating,
    sortBy,
    page,
    limit,
  } = filters;

  // Build query
  let searchQuery = { isActive: true };

  // Text search
  if (query) {
    searchQuery.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { city: { $regex: query, $options: "i" } },
      { province: { $regex: query, $options: "i" } },
      { country: { $regex: query, $options: "i" } },
    ];
  }

  // Location filters
  if (city) searchQuery.city = { $regex: city, $options: "i" };
  if (province) searchQuery.province = { $regex: province, $options: "i" };
  if (country) searchQuery.country = { $regex: country, $options: "i" };

  // Category & Type
  if (category && category !== "All") searchQuery.category = category;
  if (type) searchQuery.type = type;

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    if (minPrice !== undefined) searchQuery.price.$gte = minPrice;
    if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice;
  }

  // Capacity filters
  if (minGuests !== undefined) searchQuery.guestCount = { $gte: minGuests };
  if (minBedrooms !== undefined) searchQuery.bedroomCount = { $gte: minBedrooms };
  if (minBathrooms !== undefined) searchQuery.bathroomCount = { $gte: minBathrooms };

  // Amenities filter
  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    searchQuery.amenities = { $all: amenitiesArray };
  }

  // Execute query
  let listings = await Listing.find(searchQuery).populate("creator");

  // Filter out occupied listings (with active bookings)
  const availableListings = await Promise.all(
    listings.map(async (listing) => {
      const activeBooking = await Booking.findOne({
        listingId: listing._id,
        bookingStatus: { $in: ["pending", "approved", "checked_in"] },
        isCheckedOut: false,
      });
      return activeBooking ? null : listing;
    })
  );

  listings = availableListings.filter((listing) => listing !== null);

  // Calculate rating for each listing
  const listingsWithRating = await Promise.all(
    listings.map(async (listing) => {
      const reviews = await Review.find({
        listingId: listing._id,
        listingRating: { $gt: 0 },
      });

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.listingRating, 0) / reviews.length
          : 0;

      return {
        ...listing.toObject(),
        averageRating,
        reviewCount: reviews.length,
      };
    })
  );

  listings = listingsWithRating;

  // Filter by minimum rating
  if (minRating !== undefined) {
    listings = listings.filter((item) => item.averageRating >= minRating);
  }

  // Sort results
  if (sortBy) {
    switch (sortBy) {
      case "price_asc":
        listings.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        listings.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        listings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "newest":
        listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Default: highest rated first
        listings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
  }

  // Pagination
  const total = listings.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = listings.slice(startIndex, endIndex);

  return {
    listings: paginatedListings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };
};

module.exports = { executeSearch };
