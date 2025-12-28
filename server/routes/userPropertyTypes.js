const router = require("express").Router();
const UserPropertyType = require("../models/UserPropertyType");
const PropertyType = require("../models/PropertyType");
const { HTTP_STATUS } = require("../constants");

/**
 * GET user's property types
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { activeOnly } = req.query;

    const query = { userId };
    if (activeOnly === "true") {
      query.isActive = true;
    }

    const types = await UserPropertyType.find(query).sort({ displayOrder: 1 });

    res.status(HTTP_STATUS.OK).json(types);
  } catch (error) {
    console.error("Error fetching user property types:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch property types",
      error: error.message,
    });
  }
});

/**
 * INITIALIZE user property types from global templates
 */
router.post("/user/:userId/initialize", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user already has property types
    const existing = await UserPropertyType.find({ userId });
    if (existing.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "User property types already initialized",
        types: existing,
      });
    }

    // Get all global property types
    const globalTypes = await PropertyType.find({ isActive: true }).sort({ displayOrder: 1 });

    // Create user-specific copies
    const userTypes = globalTypes.map((type) => ({
      userId,
      name: type.name,
      description: type.description,
      icon: type.icon,
      displayOrder: type.displayOrder,
      isCustom: false,
      forkedFromId: type._id,
      isActive: true,
    }));

    const created = await UserPropertyType.insertMany(userTypes);

    console.log(`✅ Initialized ${created.length} property types for user ${userId}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: `Successfully initialized ${created.length} property types`,
      types: created,
    });
  } catch (error) {
    console.error("Error initializing user property types:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to initialize property types",
      error: error.message,
    });
  }
});

/**
 * CREATE custom property type
 */
router.post("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, icon, displayOrder } = req.body;

    const newType = new UserPropertyType({
      userId,
      name,
      description,
      icon,
      displayOrder: displayOrder || 0,
      isCustom: true,
      isActive: true,
    });

    await newType.save();

    console.log(`✅ Created custom property type: ${name}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Property type created successfully",
      type: newType,
    });
  } catch (error) {
    console.error("Error creating property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create property type",
      error: error.message,
    });
  }
});

/**
 * UPDATE property type
 */
router.patch("/user/:userId/:typeId", async (req, res) => {
  try {
    const { userId, typeId } = req.params;
    const updates = req.body;

    const type = await UserPropertyType.findOneAndUpdate(
      { _id: typeId, userId },
      updates,
      { new: true }
    );

    if (!type) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Property type not found",
      });
    }

    console.log(`✅ Updated property type: ${type.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Property type updated successfully",
      type,
    });
  } catch (error) {
    console.error("Error updating property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update property type",
      error: error.message,
    });
  }
});

/**
 * DELETE property type (soft delete)
 */
router.delete("/user/:userId/:typeId", async (req, res) => {
  try {
    const { userId, typeId } = req.params;
    const { permanent } = req.query;

    if (permanent === "true") {
      // Hard delete
      const type = await UserPropertyType.findOneAndDelete({ _id: typeId, userId });
      if (!type) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Property type not found",
        });
      }
      console.log(`🗑️  Permanently deleted property type: ${type.name}`);
      return res.status(HTTP_STATUS.OK).json({
        message: "Property type permanently deleted",
      });
    }

    // Soft delete
    const type = await UserPropertyType.findOneAndUpdate(
      { _id: typeId, userId },
      { isActive: false },
      { new: true }
    );

    if (!type) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Property type not found",
      });
    }

    console.log(`🙈 Hidden property type: ${type.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Property type hidden successfully",
      type,
    });
  } catch (error) {
    console.error("Error deleting property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete property type",
      error: error.message,
    });
  }
});

/**
 * REACTIVATE property type
 */
router.patch("/user/:userId/:typeId/reactivate", async (req, res) => {
  try {
    const { userId, typeId } = req.params;

    const type = await UserPropertyType.findOneAndUpdate(
      { _id: typeId, userId },
      { isActive: true },
      { new: true }
    );

    if (!type) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Property type not found",
      });
    }

    console.log(`👁️  Reactivated property type: ${type.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Property type reactivated successfully",
      type,
    });
  } catch (error) {
    console.error("Error reactivating property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reactivate property type",
      error: error.message,
    });
  }
});

/**
 * FORK specific global property type
 */
router.post("/user/:userId/fork/:globalTypeId", async (req, res) => {
  try {
    const { userId, globalTypeId } = req.params;

    // Get global property type
    const globalType = await PropertyType.findById(globalTypeId);
    if (!globalType) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Global property type not found",
      });
    }

    // Check if already forked
    const existing = await UserPropertyType.findOne({
      userId,
      forkedFromId: globalTypeId,
    });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Property type already forked",
        type: existing,
      });
    }

    // Create fork
    const userType = new UserPropertyType({
      userId,
      name: globalType.name,
      description: globalType.description,
      icon: globalType.icon,
      displayOrder: globalType.displayOrder,
      isCustom: false,
      forkedFromId: globalType._id,
      isActive: true,
    });

    await userType.save();

    console.log(`✅ Forked property type: ${globalType.name}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Property type forked successfully",
      type: userType,
    });
  } catch (error) {
    console.error("Error forking property type:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fork property type",
      error: error.message,
    });
  }
});

/**
 * BULK UPDATE display order
 */
router.post("/user/:userId/bulk-update-order", async (req, res) => {
  try {
    const { userId } = req.params;
    const { types } = req.body; // [{ id, displayOrder }]

    const bulkOps = types.map((item) => ({
      updateOne: {
        filter: { _id: item.id, userId },
        update: { displayOrder: item.displayOrder },
      },
    }));

    const result = await UserPropertyType.bulkWrite(bulkOps);

    console.log(`✅ Updated display order for ${result.modifiedCount} property types`);

    res.status(HTTP_STATUS.OK).json({
      message: "Display order updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating display order:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update display order",
      error: error.message,
    });
  }
});

module.exports = router;

