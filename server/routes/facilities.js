const router = require("express").Router();
const Facility = require("../models/Facility");
const { HTTP_STATUS } = require("../constants");

/**
 * GET ALL FACILITIES
 * Returns all facilities (active and inactive) or filtered by category
 */
router.get("/", async (req, res) => {
  try {
    const { activeOnly, category } = req.query;

    let facilities;

    if (category) {
      facilities = await Facility.getByCategory(category);
    } else if (activeOnly === "true") {
      facilities = await Facility.getActive();
    } else {
      facilities = await Facility.getAll();
    }

    console.log(`✅ Found ${facilities.length} facilities`);

    res.status(HTTP_STATUS.OK).json(facilities);
  } catch (error) {
    console.error("❌ Error fetching facilities:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch facilities",
      error: error.message,
    });
  }
});

/**
 * GET FACILITY BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Facility not found",
      });
    }

    res.status(HTTP_STATUS.OK).json(facility);
  } catch (error) {
    console.error("❌ Error fetching facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch facility",
      error: error.message,
    });
  }
});

/**
 * CREATE FACILITY
 */
router.post("/", async (req, res) => {
  try {
    const { name, icon, category, displayOrder } = req.body;

    // Check if facility already exists
    const existing = await Facility.findOne({ name });
    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Facility with this name already exists",
      });
    }

    const facility = new Facility({
      name,
      icon,
      category: category || "other",
      displayOrder: displayOrder || 0,
      isActive: true,
      createdBy: req.body.userId,
    });

    await facility.save();

    console.log(`✅ Facility created: ${facility.name}`);

    res.status(HTTP_STATUS.CREATED).json({
      message: "Facility created successfully",
      facility,
    });
  } catch (error) {
    console.error("❌ Error creating facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create facility",
      error: error.message,
    });
  }
});

/**
 * UPDATE FACILITY
 */
router.patch("/:id", async (req, res) => {
  try {
    const { name, icon, category, displayOrder, isActive } = req.body;

    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Facility not found",
      });
    }

    // Update fields
    if (name !== undefined) facility.name = name;
    if (icon !== undefined) facility.icon = icon;
    if (category !== undefined) facility.category = category;
    if (displayOrder !== undefined) facility.displayOrder = displayOrder;
    if (isActive !== undefined) facility.isActive = isActive;

    facility.updatedBy = req.body.userId;

    await facility.save();

    console.log(`✅ Facility updated: ${facility.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Facility updated successfully",
      facility,
    });
  } catch (error) {
    console.error("❌ Error updating facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update facility",
      error: error.message,
    });
  }
});

/**
 * DELETE FACILITY
 */
router.delete("/:id", async (req, res) => {
  try {
    const { permanent } = req.query;

    if (permanent === "true") {
      await Facility.findByIdAndDelete(req.params.id);
      console.log(`🗑️  Facility permanently deleted: ${req.params.id}`);

      return res.status(HTTP_STATUS.OK).json({
        message: "Facility permanently deleted",
      });
    } else {
      const facility = await Facility.findByIdAndUpdate(
        req.params.id,
        { isActive: false, updatedBy: req.body.userId },
        { new: true }
      );

      if (!facility) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Facility not found",
        });
      }

      console.log(`✅ Facility deactivated: ${facility.name}`);

      res.status(HTTP_STATUS.OK).json({
        message: "Facility deactivated successfully",
        facility,
      });
    }
  } catch (error) {
    console.error("❌ Error deleting facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete facility",
      error: error.message,
    });
  }
});

/**
 * REACTIVATE FACILITY
 */
router.patch("/:id/reactivate", async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.userId },
      { new: true }
    );

    if (!facility) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Facility not found",
      });
    }

    console.log(`✅ Facility reactivated: ${facility.name}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Facility reactivated successfully",
      facility,
    });
  } catch (error) {
    console.error("❌ Error reactivating facility:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to reactivate facility",
      error: error.message,
    });
  }
});

/**
 * BULK UPDATE DISPLAY ORDER
 */
router.post("/bulk-update-order", async (req, res) => {
  try {
    const { facilities } = req.body; // [{ id, displayOrder }]

    const bulkOps = facilities.map(facility => ({
      updateOne: {
        filter: { _id: facility.id },
        update: { displayOrder: facility.displayOrder }
      }
    }));

    await Facility.bulkWrite(bulkOps);

    console.log(`✅ Updated display order for ${facilities.length} facilities`);

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

