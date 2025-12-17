const router = require("express").Router();
const Booking = require("../models/Booking");
const { HTTP_STATUS } = require("../constants");

// CREATE BOOKING
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice } =
      req.body;
    const newBooking = new Booking({
      customerId,
      hostId,
      listingId,
      startDate,
      endDate,
      totalPrice,
    });
    const savedBooking = await newBooking.save();
    res.status(HTTP_STATUS.OK).json(savedBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ message: "Internal server error", error: error });
  }
});

module.exports = router;
