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
    const user = await User.findById(userId);
    const listing = await Listing.findById(listingId);

    const favoriteListing = user.wishList.find(
      (item) => item.id.toString() || item._id.toString() === listingId
    );
    if (favoriteListing) {
      user.wishList = user.wishList.filter(
        (item) => item.id.toString() || item._id.toString() !== listingId
      );
      await user.save();
      res
        .status(HTTP_STATUS.OK)
        .json({ message: "Removed from wishlist", wishList: user.wishList });
    } else {
      user.wishList.push(listing);
      await user.save();
      res
        .status(HTTP_STATUS.OK)
        .json({ message: "Added to wishlist", wishList: user.wishList });
    }
  } catch (err) {
    console.log("ERROR: Fail to add listing to wishlist", err);
    res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ message: "Trips not found", error: err.message });
  }
});
module.exports = router;
