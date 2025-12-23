const router = require("express").Router();
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const { HTTP_STATUS } = require("../constants");

// GET USER'S PROPERTIES
router.get("/:userId/properties", async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeHidden = false } = req.query;

    const query = { creator: userId };

    // If not including hidden, only show active listings
    if (!includeHidden) {
      query.isActive = true;
    }

    const properties = await Listing.find(query)
      .populate("creator", "firstName lastName email profileImagePath")
      .sort({ createdAt: -1 });

    // Check each property for active bookings
    const propertiesWithStatus = await Promise.all(
      properties.map(async (property) => {
        const activeBooking = await Booking.findOne({
          listingId: property._id,
          status: { $in: ["pending", "accepted"] },
          isCheckedOut: false,
        });

        return {
          ...property.toObject(),
          hasActiveBooking: !!activeBooking,
          activeBooking: activeBooking || null,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json(propertiesWithStatus);
  } catch (err) {
    console.error("❌ Error fetching properties:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch properties",
      error: err.message,
    });
  }
});

// UPDATE LISTING
router.patch("/:listingId/update", async (req, res) => {
  try {
    const { listingId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated via this route
    delete updateData.creator;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      updateData,
      { new: true }
    ).populate("creator", "firstName lastName email");

    if (!updatedListing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Listing not found",
      });
    }

    console.log(`✅ Listing updated: ${listingId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (err) {
    console.error("❌ Error updating listing:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update listing",
      error: err.message,
    });
  }
});

// TOGGLE LISTING VISIBILITY (Hide/Show)
router.patch("/:listingId/toggle-visibility", async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Listing not found",
      });
    }

    // Toggle isActive
    listing.isActive = !listing.isActive;
    await listing.save();

    console.log(`✅ Listing visibility toggled: ${listingId} - isActive: ${listing.isActive}`);

    res.status(HTTP_STATUS.OK).json({
      message: listing.isActive ? "Listing is now visible" : "Listing is now hidden",
      listing,
    });
  } catch (err) {
    console.error("❌ Error toggling visibility:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to toggle visibility",
      error: err.message,
    });
  }
});

// DELETE LISTING
router.delete("/:listingId/delete", async (req, res) => {
  try {
    const { listingId } = req.params;

    // Check for active bookings
    const activeBooking = await Booking.findOne({
      listingId,
      status: { $in: ["pending", "accepted"] },
      isCheckedOut: false,
    });

    if (activeBooking) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Cannot delete listing with active bookings. Please wait until all bookings are completed.",
        hasActiveBooking: true,
      });
    }

    const deletedListing = await Listing.findByIdAndDelete(listingId);

    if (!deletedListing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Listing not found",
      });
    }

    console.log(`✅ Listing deleted: ${listingId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Listing deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting listing:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete listing",
      error: err.message,
    });
  }
});

// CHECK LISTING AVAILABILITY
router.get("/:listingId/availability", async (req, res) => {
  try {
    const { listingId } = req.params;

    const activeBooking = await Booking.findOne({
      listingId,
      status: { $in: ["pending", "accepted"] },
      isCheckedOut: false,
    })
      .populate("customerId", "firstName lastName email")
      .populate("listingId", "title");

    res.status(HTTP_STATUS.OK).json({
      hasActiveBooking: !!activeBooking,
      activeBooking: activeBooking || null,
    });
  } catch (err) {
    console.error("❌ Error checking availability:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to check availability",
      error: err.message,
    });
  }
});

module.exports = router;

