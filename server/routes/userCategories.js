const router = require("express").Router();
const UserCategory = require("../models/UserCategory");
const Category = require("../models/Category");
const { HTTP_STATUS } = require("../constants");

/**
 * GET USER'S CATEGORIES
 * Returns categories specific to a user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { activeOnly } = req.query;

    const categories = await UserCategory.getByUser(userId, activeOnly === "true");

    console.log(`✅ Found ${categories.length} categories for user ${userId}`);

    res.status(HTTP_STATUS.OK).json(categories);
  } catch (error) {
    console.error("❌ Error fetching user categories:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch user categories",
      error: error.message,
    });
  }
});

/**
 * INITIALIZE USER CATEGORIES FROM GLOBAL
 * Fork all global categories for a new user
 */
router.post("/user/:userId/initialize", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user already has categories
    const existing = await UserCategory.countDocuments({ userId });
    if (existing > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "User already has categories initialized",
      });
    }

    // Get all active global categories
    const globalCategories = await Category.getActive();

    // Fork each global category for this user
    const userCategories = await Promise.all(
      globalCategories.map(cat =>
        UserCategory.createFromGlobal(userId, cat._id)
      )
    );

    console.log(`✅ Initialized ${userCategories.length} categories for user ${userId}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Categories initialized successfully",
      categories: userCategories,
    });
  } catch (error) {
    console.error("❌ Error initializing user categories:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to initialize categories",
      error: error.message,
    });
  }
});

/**
 * CREATE CUSTOM USER CATEGORY
 */
router.post("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { label, description, img, icon, displayOrder } = req.body;

    // Check if user already has a category with this label
    const existing = await UserCategory.findOne({ userId, label });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "You already have a category with this label",
      });
    }

    const category = new UserCategory({
      userId,
      label,
      description,
      img,
      icon,
      displayOrder: displayOrder || 0,
      isActive: true,
      isCustom: true, // User created this from scratch
    });

    await category.save();

    console.log(`✅ Custom category created for user ${userId}: ${category.label}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error creating user category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
});

/**
 * UPDATE USER CATEGORY
 */
router.patch("/user/:userId/:categoryId", async (req, res) => {
  try {
    const { userId, categoryId } = req.params;
    const { label, description, img, icon, displayOrder, isActive } = req.body;

    const category = await UserCategory.findOne({ _id: categoryId, userId });

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Category not found or you don't have permission",
      });
    }

    // Update fields
    if (label !== undefined) category.label = label;
    if (description !== undefined) category.description = description;
    if (img !== undefined) category.img = img;
    if (icon !== undefined) category.icon = icon;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    console.log(`✅ Category updated for user ${userId}: ${category.label}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error updating user category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update category",
      error: error.message,
    });
  }
});

/**
 * DELETE USER CATEGORY
 */
router.delete("/user/:userId/:categoryId", async (req, res) => {
  try {
    const { userId, categoryId } = req.params;
    const { permanent } = req.query;

    if (permanent === "true") {
      // Hard delete
      const result = await UserCategory.findOneAndDelete({ _id: categoryId, userId });

      if (!result) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Category not found or you don't have permission",
        });
      }

      console.log(`🗑️  Category permanently deleted for user ${userId}`);

      return res.status(HTTP_STATUS.OK).json({
        message: "Category permanently deleted",
      });
    } else {
      // Soft delete
      const category = await UserCategory.findOneAndUpdate(
        { _id: categoryId, userId },
        { isActive: false },
        { new: true }
      );

      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Category not found or you don't have permission",
        });
      }

      console.log(`✅ Category deactivated for user ${userId}: ${category.label}`);

      res.status(HTTP_STATUS.OK).json({
        message: "Category deactivated successfully",
        category,
      });
    }
  } catch (error) {
    console.error("❌ Error deleting user category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
});

/**
 * REACTIVATE USER CATEGORY
 */
router.patch("/user/:userId/:categoryId/reactivate", async (req, res) => {
  try {
    const { userId, categoryId } = req.params;

    const category = await UserCategory.findOneAndUpdate(
      { _id: categoryId, userId },
      { isActive: true },
      { new: true }
    );

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Category not found or you don't have permission",
      });
    }

    console.log(`✅ Category reactivated for user ${userId}: ${category.label}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Category reactivated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error reactivating user category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reactivate category",
      error: error.message,
    });
  }
});

/**
 * BULK UPDATE DISPLAY ORDER
 */
router.post("/user/:userId/bulk-update-order", async (req, res) => {
  try {
    const { userId } = req.params;
    const { categories } = req.body; // [{ id, displayOrder }]

    const bulkOps = categories.map(cat => ({
      updateOne: {
        filter: { _id: cat.id, userId }, // Ensure user owns this category
        update: { displayOrder: cat.displayOrder }
      }
    }));

    const result = await UserCategory.bulkWrite(bulkOps);

    console.log(`✅ Updated display order for ${result.modifiedCount} categories for user ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Display order updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error updating display order:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update display order",
      error: error.message,
    });
  }
});

/**
 * FORK GLOBAL CATEGORY
 * Add a specific global category to user's collection
 */
router.post("/user/:userId/fork/:globalCategoryId", async (req, res) => {
  try {
    const { userId, globalCategoryId } = req.params;

    // Check if user already has this category forked
    const existing = await UserCategory.findOne({ userId, forkedFromId: globalCategoryId });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "You already have this category",
      });
    }

    const category = await UserCategory.createFromGlobal(userId, globalCategoryId);

    console.log(`✅ Global category forked for user ${userId}: ${category.label}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Category forked successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error forking category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fork category",
      error: error.message,
    });
  }
});

module.exports = router;

