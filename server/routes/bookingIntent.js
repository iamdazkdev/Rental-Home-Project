const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  createSchema,
  checkAvailabilitySchema,
  cancelSchema,
  confirmSchema
} = require("../validators/bookingIntent.validator");
const intentController = require("../controllers/bookingIntent.controller");

// ==========================================
// CLEAN ROUTER - BOOKING INTENT
// ==========================================

router.post("/release-expired", asyncHandler(intentController.releaseExpiredLocks));
router.post("/create", validate(createSchema), asyncHandler(intentController.createIntent));
router.get("/check-availability/:listingId", validate(checkAvailabilitySchema), asyncHandler(intentController.checkAvailability));
router.get("/temp/:tempOrderId", asyncHandler(intentController.getByTempOrderId));
router.get("/:intentId", asyncHandler(intentController.getById));
router.put("/:intentId/cancel", validate(cancelSchema), asyncHandler(intentController.cancelIntent));
router.put("/:intentId/confirm", validate(confirmSchema), asyncHandler(intentController.confirmIntent));
router.get("/user/:userId/active", asyncHandler(intentController.getActiveUserIntents));

module.exports = router;
