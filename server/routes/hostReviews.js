const router = require("express").Router();
const Review = require("../models/Review");
const Listing = require("../models/Listing");
const { HTTP_STATUS } = require("../constants");

// GET HOST REVIEWS AND RATING
router.get("/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    // Get all listings created by this host
    const hostListings = await Listing.find({ creator: hostId }).select("_id");
    const listingIds = hostListings.map((listing) => listing._id);

    // Get all reviews for these listings that have host ratings
    const reviews = await Review.find({
      listingId: { $in: listingIds },
      hostRating: { $exists: true, $ne: null, $gt: 0 },
    })
      .populate("reviewerId", "firstName lastName profileImagePath")
      .populate("listingId", "title")
      .sort({ createdAt: -1 });

    // Calculate average host rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.hostRating || 0), 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.status(HTTP_STATUS.OK).json({
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      reviews: reviews.map((review) => ({
        _id: review._id,
        reviewer: {
          _id: review.reviewerId?._id,
          firstName: review.reviewerId?.firstName,
          lastName: review.reviewerId?.lastName,
          profileImagePath: review.reviewerId?.profileImagePath,
        },
        listing: {
          _id: review.listingId?._id,
          title: review.listingId?.title,
        },
        hostRating: review.hostRating,
        hostComment: review.hostComment,
        createdAt: review.createdAt,
      })),
    });
  } catch (err) {
    console.error("❌ Error fetching host reviews:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch host reviews",
      error: err.message,
    });
  }
});

module.exports = router;

