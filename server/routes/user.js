const router = require("express").Router();

const Booking = require("../models/Booking");
const User = require("../models/User");
const Listing = require("../models/Listing");
const { HTTP_STATUS } = require("../constants");
const { uploadUserProfile } = require("../services/cloudinaryService");

// UPDATE USER PROFILE
router.patch("/:userId/profile", uploadUserProfile.single("profileImage"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, hostBio } = req.body;

    console.log(`📝 Updating profile for user: ${userId}`);

    // Validate userId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid user ID format"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "User not found"
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (hostBio !== undefined) user.hostBio = hostBio; // Allow empty string

    // Update profile image if provided
    if (req.file) {
      console.log(`📷 New profile image uploaded`);
      user.profileImagePath = req.file.path; // Cloudinary URL
    }

    await user.save();

    console.log(`✅ Profile updated successfully for user: ${userId}`);

    res.status(HTTP_STATUS.OK).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImagePath: user.profileImagePath,
        hostBio: user.hostBio,
      }
    });
  } catch (err) {
    console.log("❌ ERROR: Failed to update profile", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update profile",
      error: err.message
    });
  }
});

// GET TRIP LIST (Active bookings only)
router.get("/:userId/trips", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log("❌ Invalid userId:", userId);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid user ID. Please log in again.",
        error: "User ID is required"
      });
    }

    // Only fetch ACTIVE bookings (exclude completed/cancelled/rejected/expired/checked_out)
    const activeStatuses = ["pending", "approved", "checked_in"];

    const trips = await Booking.find({
      customerId: userId,
      bookingStatus: { $in: activeStatuses }
    }).populate("customerId hostId listingId");

    console.log(`✅ Fetched ${trips.length} active trips for user ${userId}`);
    res.status(HTTP_STATUS.ACCEPTED).json(trips);
  } catch (err) {
    console.log("❌ ERROR: Fail to get trips", err);
    res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ message: "Trips not found", error: err.message });
  }
});

// ADD/REMOVE LISTING TO/FROM WISHLIST
router.patch("/:userId/wishlist/:listingId", async (req, res) => {
  try {
    const { userId, listingId } = req.params;

    // Validate ObjectId format before querying
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`❌ Invalid userId format: ${userId}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid user ID format"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      console.log(`❌ Invalid listingId format: ${listingId}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid listing ID format"
      });
    }

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
