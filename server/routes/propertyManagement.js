const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  userIdSchema,
  listingIdSchema,
  updateListingSchema
} = require("../validators/propertyManagement.validator");
const pmController = require("../controllers/propertyManagement.controller");

// ==========================================
// CLEAN ROUTER - PROPERTY MANAGEMENT
// ==========================================

router.get("/:userId/properties", validate(userIdSchema), asyncHandler(pmController.getUserProperties));
router.patch("/:listingId/update", validate(updateListingSchema), asyncHandler(pmController.updateListing));
router.patch("/:listingId/toggle-visibility", validate(listingIdSchema), asyncHandler(pmController.toggleVisibility));
router.delete("/:listingId/delete", validate(listingIdSchema), asyncHandler(pmController.deleteListing));
router.get("/:listingId/availability", validate(listingIdSchema), asyncHandler(pmController.checkAvailability));

module.exports = router;
