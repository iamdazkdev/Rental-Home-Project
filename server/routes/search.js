const router = require("express").Router();
const { asyncHandler } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validateHandler");
const { searchSchema } = require("../validators/search.validator");
const searchController = require("../controllers/search.controller");

// ==========================================
// CLEAN ROUTER - ADVANCED SEARCH
// ==========================================

router.get(
  "/",
  validate(searchSchema),
  asyncHandler(searchController.advancedSearch)
);

module.exports = router;
