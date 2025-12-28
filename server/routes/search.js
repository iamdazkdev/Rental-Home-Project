const router = require("express").Router();
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { HTTP_STATUS } = require("../constants");

// ADVANCED SEARCH
router.get("/", async (req, res) => {
  try {
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
      page = 1,
      limit = 20,
    } = req.query;

    console.log("🔍 Search params:", req.query);

    // Build query
    let searchQuery = { isActive: true };

    // Text search (title, description, city, province, country)
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
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = Number(minPrice);
      if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
    }

    // Capacity filters
    if (minGuests) searchQuery.guestCount = { $gte: Number(minGuests) };
    if (minBedrooms) searchQuery.bedroomCount = { $gte: Number(minBedrooms) };
    if (minBathrooms) searchQuery.bathroomCount = { $gte: Number(minBathrooms) };

    // Amenities filter
    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      searchQuery.amenities = { $all: amenitiesArray };
    }

    console.log("📊 MongoDB query:", JSON.stringify(searchQuery, null, 2));

    // Execute query
    let listings = await Listing.find(searchQuery).populate("creator");

    console.log(`✅ Found ${listings.length} listings before filters`);

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

    console.log(`✅ ${listings.length} available listings (after removing occupied)`);

    // Calculate rating for each listing if minRating is specified
    if (minRating) {
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
            listing,
            averageRating,
            reviewCount: reviews.length,
          };
        })
      );

      // Filter by minimum rating
      const filteredByRating = listingsWithRating.filter(
        (item) => item.averageRating >= Number(minRating)
      );

      listings = filteredByRating.map((item) => ({
        ...item.listing.toObject(),
        averageRating: item.averageRating,
        reviewCount: item.reviewCount,
      }));

      console.log(`✅ ${listings.length} listings after rating filter (>= ${minRating})`);
    } else {
      // Add rating info even if not filtering
      listings = await Promise.all(
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
    const endIndex = startIndex + parseInt(limit);
    const paginatedListings = listings.slice(startIndex, endIndex);

    console.log(`📄 Returning ${paginatedListings.length} listings (page ${page})`);

    res.status(HTTP_STATUS.OK).json({
      listings: paginatedListings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        query,
        city,
        province,
        country,
        category,
        type,
        priceRange: { min: minPrice, max: maxPrice },
        minGuests,
        minBedrooms,
        minBathrooms,
        amenities,
        minRating,
        sortBy,
      },
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Search failed",
      error: error.message,
    });
  }
});

module.exports = router;

