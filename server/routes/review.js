const router = require("express").Router();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const { HTTP_STATUS } = require("../constants");

// CREATE REVIEW
router.post("/", async (req, res) => {
  try {
    const {
      bookingId,
      reviewerId,
      listingRating,
      listingComment,
      hostRating,
      hostComment,
      guestRating,
      guestComment,
    } = req.body;

    // Validate required fields
    if (!bookingId || !reviewerId || !listingRating) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Missing required fields: bookingId, reviewerId, listingRating",
      });
    }

    // Validate rating ranges
    if (listingRating < 1 || listingRating > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Listing rating must be between 1 and 5",
      });
    }

    if (hostRating && (hostRating < 1 || hostRating > 5)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Host rating must be between 1 and 5",
      });
    }

    if (guestRating && (guestRating < 1 || guestRating > 5)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Guest rating must be between 1 and 5",
      });
    }

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName")
      .populate("hostId", "firstName lastName")
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    // Check if booking is eligible for review (checked out or completed)
    if (!booking.isCheckedOut && booking.status !== "completed") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Can only review after checkout or booking completion",
      });
    }

    // Check if reviewer is part of this booking
    const isCustomer = booking.customerId._id.toString() === reviewerId;
    const isHost = booking.hostId._id.toString() === reviewerId;

    if (!isCustomer && !isHost) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Only booking participants can leave reviews",
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      bookingId,
      reviewerId,
    });

    if (existingReview) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "You have already reviewed this booking",
      });
    }

    // Determine review type
    let reviewType;
    if (isCustomer) {
      reviewType = hostRating ? "guest_to_listing" : "guest_to_listing";
    } else {
      reviewType = "host_to_guest";
    }

    // Create review
    const review = new Review({
      bookingId,
      reviewerId,
      listingId: booking.listingId._id,
      listingRating,
      listingComment: listingComment || "",
      hostRating: isCustomer ? hostRating : null,
      hostComment: isCustomer ? (hostComment || "") : "",
      guestRating: isHost ? guestRating : null,
      guestComment: isHost ? (guestComment || "") : "",
      reviewType,
    });

    const savedReview = await review.save();

    // Create notification for the other party
    const recipientId = isCustomer ? booking.hostId._id : booking.customerId._id;
    const recipientName = isCustomer ? booking.hostId : booking.customerId;

    await createNotification(
      recipientId,
      "new_review",
      booking._id,
      `${isCustomer ? booking.customerId.firstName : booking.hostId.firstName} has left a review for your ${isCustomer ? 'listing' : 'stay'} at "${booking.listingId.title}"`,
      isCustomer ? `/reservations` : `/${booking.customerId._id}/trips`
    );

    console.log(`✅ Review created: ${savedReview._id} by ${reviewerId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Review submitted successfully",
      review: savedReview,
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to submit review",
      error: error.message,
    });
  }
});

// GET REVIEWS FOR LISTING
router.get("/listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      listingId,
      isVisible: true,
    })
      .populate("reviewerId", "firstName lastName profileImagePath")
      .populate("bookingId", "startDate endDate")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      listingId,
      isVisible: true,
    });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { listingId: new mongoose.Types.ObjectId(listingId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$listingRating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$listingRating"
          }
        }
      }
    ]);

    const stats = ratingStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: []
    };

    res.status(HTTP_STATUS.OK).json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching listing reviews:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

// GET REVIEWS BY USER (reviews written by user)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({
      reviewerId: userId,
      isVisible: true,
    })
      .populate("listingId", "title city province country listingPhotoPaths")
      .populate("bookingId", "startDate endDate")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${reviews.length} reviews by user ${userId}`);

    res.status(HTTP_STATUS.OK).json(reviews);
  } catch (error) {
    console.error("❌ Error fetching user reviews:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

// UPDATE REVIEW
router.patch("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updates = req.body;

    // Validate rating ranges if provided
    if (updates.listingRating && (updates.listingRating < 1 || updates.listingRating > 5)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Listing rating must be between 1 and 5",
      });
    }

    if (updates.hostRating && (updates.hostRating < 1 || updates.hostRating > 5)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Host rating must be between 1 and 5",
      });
    }

    if (updates.guestRating && (updates.guestRating < 1 || updates.guestRating > 5)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Guest rating must be between 1 and 5",
      });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Review not found",
      });
    }

    console.log(`✅ Review ${reviewId} updated`);

    res.status(HTTP_STATUS.OK).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("❌ Error updating review:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update review",
      error: error.message,
    });
  }
});

// DELETE REVIEW (soft delete)
router.delete("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isVisible: false },
      { new: true }
    );

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Review not found",
      });
    }

    console.log(`✅ Review ${reviewId} hidden`);

    res.status(HTTP_STATUS.OK).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete review",
      error: error.message,
    });
  }
});

// Helper function to create notification
const createNotification = async (userId, type, bookingId, message, link = "") => {
  try {
    const notification = new Notification({
      userId,
      type,
      bookingId,
      message,
      link,
    });
    await notification.save();
    console.log(`✅ Notification created for user ${userId}: ${type}`);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
};

module.exports = router;
