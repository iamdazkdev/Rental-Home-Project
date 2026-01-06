const router = require("express").Router();
const UserFacility = require("../models/UserFacility");
const Facility = require("../models/Facility");
const { HTTP_STATUS } = require("../constants");

/**
 * GET user's facilities
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { activeOnly, category } = req.query;

    const query = { userId };
    if (activeOnly === "true") {
      query.isActive = true;
    }
    if (category) {
      query.category = category;
    }

    const facilities = await UserFacility.find(query).sort({ category: 1, displayOrder: 1 });

    res.status(HTTP_STATUS.OK).json(facilities);
  } catch (error) {
    console.error("Error fetching user facilities:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch facilities",
      error: error.message,
    });
  }
});

/**
 * INITIALIZE user facilities from global templates
 */
router.post("/user/:userId/initialize", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user already has facilities
    const existing = await UserFacility.find({ userId });
    if (existing.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "User facilities already initialized",
        facilities: existing,
      });
    }

    // Get all global facilities
    const globalFacilities = await Facility.find({ isActive: true }).sort({ displayOrder: 1 });

    // Create user-specific copies
    const userFacilities = globalFacilities.map((facility) => ({
      userId,
      name: facility.name,
      description: facility.description,
      icon: facility.icon,
      category: facility.category,
      displayOrder: facility.displayOrder,
      isCustom: false,
      forkedFromId: facility._id,
      isActive: true,
    }));

    const created = await UserFacility.insertMany(userFacilities);

    console.log(`✅ Initialized ${created.length} facilities for user ${userId}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: `Successfully initialized ${created.length} facilities`,
      facilities: created,
    });
  } catch (error) {
    console.error("Error initializing user facilities:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to initialize facilities",
      error: error.message,
    });
  }
});

/**
 * CREATE custom facility
 */
router.post("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, icon, category, displayOrder } = req.body;

    const newFacility = new UserFacility({
      userId,
      name,
      description,
      icon,
      category: category || "other",
      displayOrder: displayOrder || 0,
      isCustom: true,
      isActive: true,
    });

    await newFacility.save();

    console.log(`✅ Created custom facility: ${name}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Facility created successfully",
      facility: newFacility,
    });
  } catch (error) {
    console.error("Error creating facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create facility",
      error: error.message,
    });
  }
});

/**
 * UPDATE facility
 */
router.patch("/user/:userId/:facilityId", async (req, res) => {
  try {
    const { userId, facilityId } = req.params;
    const updates = req.body;

    const facility = await UserFacility.findOneAndUpdate(
      { _id: facilityId, userId },
      updates,
      { new: true }
    );

    if (!facility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Facility not found",
      });
    }

    console.log(`✅ Updated facility: ${facility.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Facility updated successfully",
      facility,
    });
  } catch (error) {
    console.error("Error updating facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update facility",
      error: error.message,
    });
  }
});

/**
 * DELETE facility (soft delete)
 */
router.delete("/user/:userId/:facilityId", async (req, res) => {
  try {
    const { userId, facilityId } = req.params;
    const { permanent } = req.query;

    if (permanent === "true") {
      // Hard delete
      const facility = await UserFacility.findOneAndDelete({ _id: facilityId, userId });
      if (!facility) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Facility not found",
        });
      }
      console.log(`🗑️  Permanently deleted facility: ${facility.name}`);
      return res.status(HTTP_STATUS.OK).json({
        message: "Facility permanently deleted",
      });
    }

    // Soft delete
    const facility = await UserFacility.findOneAndUpdate(
      { _id: facilityId, userId },
      { isActive: false },
      { new: true }
    );

    if (!facility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Facility not found",
      });
    }

    console.log(`🙈 Hidden facility: ${facility.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Facility hidden successfully",
      facility,
    });
  } catch (error) {
    console.error("Error deleting facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete facility",
      error: error.message,
    });
  }
});

/**
 * REACTIVATE facility
 */
router.patch("/user/:userId/:facilityId/reactivate", async (req, res) => {
  try {
    const { userId, facilityId } = req.params;

    const facility = await UserFacility.findOneAndUpdate(
      { _id: facilityId, userId },
      { isActive: true },
      { new: true }
    );

    if (!facility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Facility not found",
      });
    }

    console.log(`👁️  Reactivated facility: ${facility.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Facility reactivated successfully",
      facility,
    });
  } catch (error) {
    console.error("Error reactivating facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reactivate facility",
      error: error.message,
    });
  }
});

/**
 * FORK specific global facility
 */
router.post("/user/:userId/fork/:globalFacilityId", async (req, res) => {
  try {
    const { userId, globalFacilityId } = req.params;

    // Get global facility
    const globalFacility = await Facility.findById(globalFacilityId);
    if (!globalFacility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Global facility not found",
      });
    }

    // Check if already forked
    const existing = await UserFacility.findOne({
      userId,
      forkedFromId: globalFacilityId,
    });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Facility already forked",
        facility: existing,
      });
    }

    // Create fork
    const userFacility = new UserFacility({
      userId,
      name: globalFacility.name,
      description: globalFacility.description,
      icon: globalFacility.icon,
      category: globalFacility.category,
      displayOrder: globalFacility.displayOrder,
      isCustom: false,
      forkedFromId: globalFacility._id,
      isActive: true,
    });

    await userFacility.save();

    console.log(`✅ Forked facility: ${globalFacility.name}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Facility forked successfully",
      facility: userFacility,
    });
  } catch (error) {
    console.error("Error forking facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fork facility",
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
    const { facilities } = req.body; // [{ id, displayOrder }]

    const bulkOps = facilities.map((item) => ({
      updateOne: {
        filter: { _id: item.id, userId },
        update: { displayOrder: item.displayOrder },
      },
    }));

    const result = await UserFacility.bulkWrite(bulkOps);

    console.log(`✅ Updated display order for ${result.modifiedCount} facilities`);

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

