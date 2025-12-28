const router = require("express").Router();
const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { HTTP_STATUS } = require("../constants");

// GET HOST PROFILE
router.get("/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    console.log("🔍 Fetching host profile for ID:", hostId);

    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      console.log("❌ Invalid ObjectId format:", hostId);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid host ID format",
      });
    }

    // Get host information
    const host = await User.findById(hostId).select(
      "firstName lastName email profileImagePath createdAt"
    );

    console.log("📥 Host found:", host ? "Yes" : "No");

    if (!host) {
      console.log("❌ Host not found in database");
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Host not found",
      });
    }

    // Get host's active listings
    const listings = await Listing.find({
      creator: hostId,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Get total bookings hosted
    const totalBookings = await Booking.countDocuments({
      hostId,
      bookingStatus: { $in: ["approved", "completed", "checked_out"] },
    });

    // Get host reviews from bookings
    const hostReviews = await Review.find({
      hostId,
      hostRating: { $gt: 0 },
    })
      .populate("reviewerId", "firstName lastName profileImagePath")
      .populate("bookingId")
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate average host rating
    const reviewsWithHostRating = hostReviews.filter((r) => r.hostRating > 0);
    const averageHostRating =
      reviewsWithHostRating.length > 0
        ? reviewsWithHostRating.reduce((sum, r) => sum + r.hostRating, 0) /
          reviewsWithHostRating.length
        : 0;

    // Get total reviews count
    const totalReviews = reviewsWithHostRating.length;

    // Calculate response rate (approved / total requests)
    const totalRequests = await Booking.countDocuments({
      hostId,
      bookingStatus: { $in: ["pending", "approved", "rejected"] },
    });
    const acceptedRequests = await Booking.countDocuments({
      hostId,
      bookingStatus: "approved",
    });
    const responseRate =
      totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;

    // Member since
    const memberSince = host.createdAt;

    // Check each listing for active booking status
    const listingsWithStatus = await Promise.all(
      listings.map(async (listing) => {
        const activeBooking = await Booking.findOne({
          listingId: listing._id,
          bookingStatus: { $in: ["pending", "approved", "checked_in"] },
          isCheckedOut: false,
        });

        return {
          ...listing.toObject(),
          hasActiveBooking: !!activeBooking,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      host: {
        _id: host._id,
        firstName: host.firstName,
        lastName: host.lastName,
        email: host.email,
        profileImagePath: host.profileImagePath,
        memberSince,
      },
      statistics: {
        totalListings: listings.length,
        totalBookings,
        totalReviews,
        averageHostRating: Number(averageHostRating.toFixed(1)),
        responseRate: Number(responseRate.toFixed(0)),
      },
      listings: listingsWithStatus,
      reviews: hostReviews,
    });
  } catch (err) {
    console.error("❌ Error fetching host profile:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch host profile",
      error: err.message,
    });
  }
});

module.exports = router;

