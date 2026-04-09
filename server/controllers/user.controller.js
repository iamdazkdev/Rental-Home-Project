const userService = require("../services/user.service");
const { HTTP_STATUS } = require("../constants");

const getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.status(HTTP_STATUS.OK).json({ success: true, ...user.toObject() });
};

const updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.params.userId, req.body, req.file);
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
};

const getUserTrips = async (req, res) => {
  const trips = await userService.getUserTrips(req.params.userId);
  res.status(HTTP_STATUS.ACCEPTED).json(trips);
};

const toggleWishlist = async (req, res) => {
  const { added, wishList } = await userService.toggleWishlist(req.params.userId, req.params.listingId);
  res.status(HTTP_STATUS.OK).json({
    message: added ? "Added to wishlist" : "Removed from wishlist",
    wishList
  });
};

module.exports = { getUserById, updateProfile, getUserTrips, toggleWishlist };
