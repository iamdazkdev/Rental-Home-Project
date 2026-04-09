const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const createNotification = require("../utils/createNotification");
const { HTTP_STATUS } = require("../constants");

class ReviewService {
    async createReview(data) {
        const { bookingId, reviewerId, listingRating, listingComment, hostRating, hostComment, guestRating, guestComment } = data;

        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("hostId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) {
            const error = new Error("Booking not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (!booking.isCheckedOut && booking.bookingStatus !== "completed") {
            const error = new Error("Can only review after checkout or booking completion");
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        const isCustomer = booking.customerId._id.toString() === reviewerId;
        const isHost = booking.hostId._id.toString() === reviewerId;

        if (!isCustomer && !isHost) {
            const error = new Error("Only booking participants can leave reviews");
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        const existingReview = await Review.findOne({ bookingId, reviewerId });

        if (existingReview) {
            const error = new Error("You have already reviewed this booking");
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        let reviewType = isCustomer ? "guest_to_listing" : "host_to_guest";

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

        const recipientId = isCustomer ? booking.hostId._id : booking.customerId._id;
        
        await createNotification({
            userId: recipientId,
            type: "new_review",
            bookingId: booking._id,
            message: `${isCustomer ? booking.customerId.firstName : booking.hostId.firstName} has left a review for your ${isCustomer ? 'listing' : 'stay'} at "${booking.listingId.title}"`,
            link: isCustomer ? `/reservations` : `/${booking.customerId._id}/trips`,
        });

        return savedReview;
    }

    async getListingReviews(listingId, page = 1, limit = 10) {
        const reviews = await Review.find({ listingId, isVisible: true })
            .populate("reviewerId", "firstName lastName profileImagePath")
            .populate("bookingId", "startDate endDate")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ listingId, isVisible: true });

        const ratingStats = await Review.aggregate([
            { $match: { listingId: new mongoose.Types.ObjectId(listingId), isVisible: true } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$listingRating" },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: { $push: "$listingRating" }
                }
            }
        ]);

        const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };

        return {
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
        };
    }

    async getUserReviews(userId) {
        return await Review.find({ reviewerId: userId, isVisible: true })
            .populate("listingId", "title city province country listingPhotoPaths")
            .populate("bookingId", "startDate endDate")
            .sort({ createdAt: -1 });
    }

    async updateReview(reviewId, updates) {
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { ...updates, updatedAt: new Date() },
            { new: true }
        );

        if (!review) {
            const error = new Error("Review not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        return review;
    }

    async deleteReview(reviewId) {
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { isVisible: false },
            { new: true }
        );

        if (!review) {
            const error = new Error("Review not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
    }
}

module.exports = new ReviewService();
