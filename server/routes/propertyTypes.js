const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  getAllQuerySchema,
  idParamSchema,
  createPropertyTypeSchema,
  updatePropertyTypeSchema,
  deletePropertyTypeSchema,
  bulkUpdateSchema
} = require("../validators/propertyType.validator");
const propertyTypeController = require("../controllers/propertyType.controller");

// ==========================================
// CLEAN ROUTER - PROPERTY TYPES
// ==========================================

router.get("/", validate(getAllQuerySchema), asyncHandler(propertyTypeController.getAllPropertyTypes));
router.get("/:id", validate(idParamSchema), asyncHandler(propertyTypeController.getPropertyTypeById));
router.post("/", validate(createPropertyTypeSchema), asyncHandler(propertyTypeController.createPropertyType));
router.patch("/:id", validate(updatePropertyTypeSchema), asyncHandler(propertyTypeController.updatePropertyType));
router.delete("/:id", validate(deletePropertyTypeSchema), asyncHandler(propertyTypeController.deletePropertyType));
router.patch("/:id/reactivate", validate(idParamSchema), asyncHandler(propertyTypeController.reactivatePropertyType));
router.post("/bulk-update-order", validate(bulkUpdateSchema), asyncHandler(propertyTypeController.bulkUpdateOrder));

module.exports = router;
