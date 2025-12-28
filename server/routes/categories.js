const router = require("express").Router();
const Category = require("../models/Category");
const { HTTP_STATUS } = require("../constants");

/**
 * GET ALL CATEGORIES
 * Returns all categories (active and inactive) or only active ones
 */
router.get("/", async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const categories = activeOnly === "true"
      ? await Category.getActive()
      : await Category.getAll();

    console.log(`✅ Found ${categories.length} categories`);

    res.status(HTTP_STATUS.OK).json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

/**
 * GET CATEGORY BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Category not found",
      });
    }

    res.status(HTTP_STATUS.OK).json(category);
  } catch (error) {
    console.error("❌ Error fetching category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch category",
      error: error.message,
    });
  }
});

/**
 * CREATE CATEGORY
 * Admin/Host can create new category
 */
router.post("/", async (req, res) => {
  try {
    const { label, description, img, icon, displayOrder } = req.body;

    // Check if category already exists
    const existing = await Category.findOne({ label });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Category with this label already exists",
      });
    }

    const category = new Category({
      label,
      description,
      img,
      icon,
      displayOrder: displayOrder || 0,
      isActive: true,
      createdBy: req.body.userId, // From auth middleware
    });

    await category.save();

    console.log(`✅ Category created: ${category.label}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error creating category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
});

/**
 * UPDATE CATEGORY
 */
router.patch("/:id", async (req, res) => {
  try {
    const { label, description, img, icon, displayOrder, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Category not found",
      });
    }

    // Update fields
    if (label !== undefined) category.label = label;
    if (description !== undefined) category.description = description;
    if (img !== undefined) category.img = img;
    if (icon !== undefined) category.icon = icon;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    category.updatedBy = req.body.userId;

    await category.save();

    console.log(`✅ Category updated: ${category.label}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error updating category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update category",
      error: error.message,
    });
  }
});

/**
 * DELETE CATEGORY
 * Soft delete by setting isActive = false
 */
router.delete("/:id", async (req, res) => {
  try {
    const { permanent } = req.query;

    if (permanent === "true") {
      // Hard delete
      await Category.findByIdAndDelete(req.params.id);
      console.log(`🗑️  Category permanently deleted: ${req.params.id}`);

      return res.status(HTTP_STATUS.OK).json({
        message: "Category permanently deleted",
      });
    } else {
      // Soft delete
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { isActive: false, updatedBy: req.body.userId },
        { new: true }
      );

      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Category not found",
        });
      }

      console.log(`✅ Category deactivated: ${category.label}`);

      res.status(HTTP_STATUS.OK).json({
        message: "Category deactivated successfully",
        category,
      });
    }
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
});

/**
 * REACTIVATE CATEGORY
 */
router.patch("/:id/reactivate", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.userId },
      { new: true }
    );

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Category not found",
      });
    }

    console.log(`✅ Category reactivated: ${category.label}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Category reactivated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error reactivating category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reactivate category",
      error: error.message,
    });
  }
});

/**
 * BULK UPDATE DISPLAY ORDER
 */
router.post("/bulk-update-order", async (req, res) => {
  try {
    const { categories } = req.body; // [{ id, displayOrder }]

    const bulkOps = categories.map(cat => ({
      updateOne: {
        filter: { _id: cat.id },
        update: { displayOrder: cat.displayOrder }
      }
    }));

    await Category.bulkWrite(bulkOps);

    console.log(`✅ Updated display order for ${categories.length} categories`);

    res.status(HTTP_STATUS.OK).json({
      message: "Display order updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating display order:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update display order",
      error: error.message,
    });
  }
});

module.exports = router;

