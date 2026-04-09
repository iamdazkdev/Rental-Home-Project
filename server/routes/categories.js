const router = require("express").Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validateHandler');
const {
  getAllQuerySchema,
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  bulkUpdateSchema
} = require("../validators/category.validator");
const categoryController = require("../controllers/category.controller");

// ==========================================
// CLEAN ROUTER - CATEGORIES
// ==========================================

router.get("/", validate(getAllQuerySchema), asyncHandler(categoryController.getAllCategories));
router.get("/:id", validate(idParamSchema), asyncHandler(categoryController.getCategoryById));
router.post("/", validate(createCategorySchema), asyncHandler(categoryController.createCategory));
router.patch("/:id", validate(updateCategorySchema), asyncHandler(categoryController.updateCategory));
router.delete("/:id", validate(deleteCategorySchema), asyncHandler(categoryController.deleteCategory));
router.patch("/:id/reactivate", validate(idParamSchema), asyncHandler(categoryController.reactivateCategory));
router.post("/bulk-update-order", validate(bulkUpdateSchema), asyncHandler(categoryController.bulkUpdateOrder));

module.exports = router;
