const reviewService = require("../services/review.service");
const { HTTP_STATUS } = require("../constants");

const createReview = async (req, res) => {
    const review = await reviewService.createReview(req.body);
    res.status(HTTP_STATUS.OK).json({
        message: "Review submitted successfully",
        review,
    });
};

const getListingReviews = async (req, res) => {
    const { listingId } = req.params;
    const { page, limit } = req.query;
    const result = await reviewService.getListingReviews(listingId, page, limit);
    res.status(HTTP_STATUS.OK).json(result);
};

const getUserReviews = async (req, res) => {
    const reviews = await reviewService.getUserReviews(req.params.userId);
    res.status(HTTP_STATUS.OK).json(reviews);
};

const updateReview = async (req, res) => {
    const review = await reviewService.updateReview(req.params.reviewId, req.body);
    res.status(HTTP_STATUS.OK).json({
        message: "Review updated successfully",
        review,
    });
};

const deleteReview = async (req, res) => {
    await reviewService.deleteReview(req.params.reviewId);
    res.status(HTTP_STATUS.OK).json({
        message: "Review deleted successfully",
    });
};

module.exports = {
    createReview,
    getListingReviews,
    getUserReviews,
    updateReview,
    deleteReview
};
