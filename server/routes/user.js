const router = require("express").Router();
const { asyncHandler } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validateHandler");
const { uploadUserProfile } = require("../services/cloudinary.service");
const { getUserSchema, updateProfileSchema, getTripsSchema, toggleWishlistSchema } = require("../validators/user.validator");
const userController = require("../controllers/user.controller");

// ==========================================
// CLEAN ROUTER - USER PROFILE
// ==========================================

router.get(
  "/:userId",
  validate(getUserSchema),
  asyncHandler(userController.getUserById)
);

router.patch(
  "/:userId/profile",
  uploadUserProfile.single("profileImage"),
  validate(updateProfileSchema),
  asyncHandler(userController.updateProfile)
);

router.get(
  "/:userId/trips",
  validate(getTripsSchema),
  asyncHandler(userController.getUserTrips)
);

router.patch(
  "/:userId/wishlist/:listingId",
  validate(toggleWishlistSchema),
  asyncHandler(userController.toggleWishlist)
);

module.exports = router;
