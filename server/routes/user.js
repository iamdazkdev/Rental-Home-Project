const router = require("express").Router();

const Booking = require("../models/Booking");
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

module.exports = router;
