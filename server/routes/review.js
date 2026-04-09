const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  createReviewSchema,
  getListingReviewsSchema,
  userIdSchema,
  updateReviewSchema,
  reviewIdSchema
} = require("../validators/review.validator");
const reviewController = require("../controllers/review.controller");

// ==========================================
// CLEAN ROUTER - REVIEWS
// ==========================================

router.post("/", validate(createReviewSchema), asyncHandler(reviewController.createReview));
router.get("/listing/:listingId", validate(getListingReviewsSchema), asyncHandler(reviewController.getListingReviews));
router.get("/user/:userId", validate(userIdSchema), asyncHandler(reviewController.getUserReviews));
router.patch("/:reviewId", validate(updateReviewSchema), asyncHandler(reviewController.updateReview));
router.delete("/:reviewId", validate(reviewIdSchema), asyncHandler(reviewController.deleteReview));

module.exports = router;
