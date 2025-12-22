const router = require("express").Router();

const Booking = require("../models/Booking");
const User = require("../models/User");
const Listing = require("../models/Listing");
const { HTTP_STATUS } = require("../constants");

// GET TRIP LIST
router.get("/:userId/trips", async (req, res) => {
  try {
    const { userId } = req.params;
    const trips = await Booking.find({ customerId: userId }).populate(
      "customerId hostId listingId"
    );
    res.status(HTTP_STATUS.ACCEPTED).json(trips);
  } catch (err) {
    console.log("ERROR: Fail to get trips", err);
    res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ message: "Trips not found", error: err.message });
  }
});

// ADD LISTING TO WISHLIST
router.patch("/:userId/:listingId", async (req, res) => {
  try {
    const { userId, listingId } = req.params;

    // Run both queries in parallel and use .exec() to get proper promises
    const [user, listing] = await Promise.all([
      User.findById(userId).exec(),
      Listing.findById(listingId).exec()
    ]);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    }
    if (!listing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Listing not found" });
    }

    // Normalize id extraction and compare as strings
    const favoriteIndex = user.wishList.findIndex((item) => {
      const id = item && (item._id || item.id || item);
      return String(id) === String(listingId);
    });

    if (favoriteIndex !== -1) {
      // Remove from wishlist
      user.wishList.splice(favoriteIndex, 1);
      await user.save();
      return res
        .status(HTTP_STATUS.OK)
        .json({ message: "Removed from wishlist", wishList: user.wishList });
    } else {
      // Add listing id to wishlist (store id instead of full doc)
      user.wishList.push(listing._id);
      await user.save();
      return res
        .status(HTTP_STATUS.OK)
        .json({ message: "Added to wishlist", wishList: user.wishList });
    }
  } catch (err) {
    console.log("ERROR: Fail to add listing to wishlist", err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to update wishlist", error: err.message });
  }
});
module.exports = router;
