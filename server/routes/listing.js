const router = require("express").Router();
const { asyncHandler } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validateHandler");
const { upload } = require("../services/cloudinary.service");
const { createListingSchema, updateListingSchema } = require("../validators/listing.validator");
const listingController = require("../controllers/listing.controller");

// ==========================================
// CLEAN ROUTER - LISTINGS
// ==========================================

router.post(
  "/create",
  upload.array("listingPhotos"),
  validate(createListingSchema),
  asyncHandler(listingController.createListing)
);

router.get(
  "/",
  asyncHandler(listingController.getListings)
);

router.get(
  "/:id",
  asyncHandler(listingController.getListingById)
);

router.put(
  "/:id",
  upload.array("listingPhotos"),
  validate(updateListingSchema),
  asyncHandler(listingController.updateListing)
);

module.exports = router;
