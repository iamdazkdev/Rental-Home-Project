const router = require("express").Router();
const PropertyType = require("../models/PropertyType");
const { HTTP_STATUS } = require("../constants");

/**
 * GET ALL PROPERTY TYPES
 * Returns all types (active and inactive) or only active ones
 */
router.get("/", async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const types = activeOnly === "true"
      ? await PropertyType.getActive()
      : await PropertyType.getAll();

    console.log(`✅ Found ${types.length} property types`);

    res.status(HTTP_STATUS.OK).json(types);
  } catch (error) {
    console.error("❌ Error fetching property types:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch property types",
      error: error.message,
    });
  }
});

/**
 * GET PROPERTY TYPE BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const type = await PropertyType.findById(req.params.id);

    if (!type) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Property type not found",
      });
    }

    res.status(HTTP_STATUS.OK).json(type);
  } catch (error) {
    console.error("❌ Error fetching property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch property type",
      error: error.message,
    });
  }
});

/**
 * CREATE PROPERTY TYPE
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, icon, displayOrder } = req.body;

    // Check if type already exists
    const existing = await PropertyType.findOne({ name });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Property type with this name already exists",
      });
    }

    const type = new PropertyType({
      name,
      description,
      icon,
      displayOrder: displayOrder || 0,
      isActive: true,
      createdBy: req.body.userId,
    });

    await type.save();

    console.log(`✅ Property type created: ${type.name}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Property type created successfully",
      type,
    });
  } catch (error) {
    console.error("❌ Error creating property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create property type",
      error: error.message,
    });
  }
});

/**
 * UPDATE PROPERTY TYPE
 */
router.patch("/:id", async (req, res) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;

    const type = await PropertyType.findById(req.params.id);

    if (!type) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Property type not found",
      });
    }

    // Update fields
    if (name !== undefined) type.name = name;
    if (description !== undefined) type.description = description;
    if (icon !== undefined) type.icon = icon;
    if (displayOrder !== undefined) type.displayOrder = displayOrder;
    if (isActive !== undefined) type.isActive = isActive;

    type.updatedBy = req.body.userId;

    await type.save();

    console.log(`✅ Property type updated: ${type.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Property type updated successfully",
      type,
    });
  } catch (error) {
    console.error("❌ Error updating property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update property type",
      error: error.message,
    });
  }
});

/**
 * DELETE PROPERTY TYPE
 */
router.delete("/:id", async (req, res) => {
  try {
    const { permanent } = req.query;

    if (permanent === "true") {
      await PropertyType.findByIdAndDelete(req.params.id);
      console.log(`🗑️  Property type permanently deleted: ${req.params.id}`);

      return res.status(HTTP_STATUS.OK).json({
        message: "Property type permanently deleted",
      });
    } else {
      const type = await PropertyType.findByIdAndUpdate(
        req.params.id,
        { isActive: false, updatedBy: req.body.userId },
        { new: true }
      );

      if (!type) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Property type not found",
        });
      }

      console.log(`✅ Property type deactivated: ${type.name}`);

      res.status(HTTP_STATUS.OK).json({
        message: "Property type deactivated successfully",
        type,
      });
    }
  } catch (error) {
    console.error("❌ Error deleting property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete property type",
      error: error.message,
    });
  }
});

/**
 * REACTIVATE PROPERTY TYPE
 */
router.patch("/:id/reactivate", async (req, res) => {
  try {
    const type = await PropertyType.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.userId },
      { new: true }
    );

    if (!type) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Property type not found",
      });
    }

    console.log(`✅ Property type reactivated: ${type.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Property type reactivated successfully",
      type,
    });
  } catch (error) {
    console.error("❌ Error reactivating property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reactivate property type",
      error: error.message,
    });
  }
});

/**
 * BULK UPDATE DISPLAY ORDER
 */
router.post("/bulk-update-order", async (req, res) => {
  try {
    const { types } = req.body; // [{ id, displayOrder }]

    const bulkOps = types.map(type => ({
      updateOne: {
        filter: { _id: type.id },
        update: { displayOrder: type.displayOrder }
      }
    }));

    await PropertyType.bulkWrite(bulkOps);

    console.log(`✅ Updated display order for ${types.length} property types`);

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

