const router = require("express").Router();
const { asyncHandler } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validateHandler");
const {
  createFacilitySchema,
  updateFacilitySchema,
  bulkUpdateOrderSchema
} = require("../validators/facility.validator");
const facilityController = require("../controllers/facility.controller");

// ==========================================
// CLEAN ROUTER - FACILITIES
// ==========================================

router.get("/", asyncHandler(facilityController.getFacilities));

router.get("/:id", asyncHandler(facilityController.getFacilityById));

router.post(
  "/",
  validate(createFacilitySchema),
  asyncHandler(facilityController.createFacility)
);

router.patch(
  "/:id",
  validate(updateFacilitySchema),
  asyncHandler(facilityController.updateFacility)
);

router.delete("/:id", asyncHandler(facilityController.deleteFacility));

router.patch(
  "/:id/reactivate",
  asyncHandler(facilityController.reactivateFacility)
);

router.post(
  "/bulk-update-order",
  validate(bulkUpdateOrderSchema),
  asyncHandler(facilityController.bulkUpdateDisplayOrder)
);

module.exports = router;
