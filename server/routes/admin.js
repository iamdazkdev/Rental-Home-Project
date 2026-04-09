const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  adminIdParamSchema,
  adminUsersQuerySchema,
  adminRoleSchema,
  adminUserActionSchema,
  adminListingsQuerySchema,
  adminListingActionSchema
} = require("../validators/admin.validator");
const adminController = require("../controllers/admin.controller");

// ==========================================
// CLEAN ROUTER - ADMIN
// ==========================================

router.get("/stats/:adminId", validate(adminIdParamSchema), adminController.isAdmin, asyncHandler(adminController.getStats));
router.get("/users/:adminId", validate(adminUsersQuerySchema), adminController.isAdmin, asyncHandler(adminController.getUsers));
router.patch("/users/:adminId/:userId/role", validate(adminRoleSchema), adminController.isAdmin, asyncHandler(adminController.updateUserRole));
router.delete("/users/:adminId/:userId", validate(adminUserActionSchema), adminController.isAdmin, asyncHandler(adminController.deleteUser));
router.get("/listings/:adminId", validate(adminListingsQuerySchema), adminController.isAdmin, asyncHandler(adminController.getListings));
router.delete("/listings/:adminId/:listingId", validate(adminListingActionSchema), adminController.isAdmin, asyncHandler(adminController.deleteListing));
router.patch("/listings/:adminId/:listingId/toggle", validate(adminListingActionSchema), adminController.isAdmin, asyncHandler(adminController.toggleListing));

module.exports = router;
