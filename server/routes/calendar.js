const router = require("express").Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  calendarGetSchema,
  blockDateSchema,
  deleteBlockSchema,
  setPricingSchema,
  deletePricingSchema,
  checkAvailabilitySchema
} = require("../validators/calendar.validator");
const calendarController = require("../controllers/calendar.controller");

// ==========================================
// CLEAN ROUTER - CALENDAR
// ==========================================

router.get("/:listingId", authenticateToken, validate(calendarGetSchema), asyncHandler(calendarController.getCalendarData));
router.post("/:listingId/block", authenticateToken, validate(blockDateSchema), asyncHandler(calendarController.blockDates));
router.delete("/:listingId/block/:blockId", authenticateToken, validate(deleteBlockSchema), asyncHandler(calendarController.unblockDates));
router.post("/:listingId/pricing", authenticateToken, validate(setPricingSchema), asyncHandler(calendarController.setPricing));
router.delete("/:listingId/pricing/:priceId", authenticateToken, validate(deletePricingSchema), asyncHandler(calendarController.removePricing));

// Public endpoint
router.get("/availability/:listingId", validate(checkAvailabilitySchema), asyncHandler(calendarController.checkAvailability));

module.exports = router;
