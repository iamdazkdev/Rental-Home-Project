const User = require("../models/User");
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const updateProfile = async (userId, data, file) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (data.firstName) user.firstName = data.firstName;
  if (data.lastName) user.lastName = data.lastName;
  if (data.email) user.email = data.email;
  if (data.hostBio !== undefined) user.hostBio = data.hostBio;

  if (file) {
    user.profileImagePath = file.path;
  }

  return await user.save();
};

const getUserTrips = async (userId) => {
  const activeStatuses = ["pending", "approved", "checked_in"];
  return await Booking.find({
    customerId: userId,
    bookingStatus: { $in: activeStatuses }
  }).populate("customerId hostId listingId");
};

const toggleWishlist = async (userId, listingId) => {
  const [user, listing] = await Promise.all([
    User.findById(userId).exec(),
    Listing.findById(listingId).exec()
  ]);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (!listing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }

  const favoriteIndex = user.wishList.findIndex((item) => {
    const id = item && (item._id || item.id || item);
    return String(id) === String(listingId);
  });

  if (favoriteIndex !== -1) {
    user.wishList.splice(favoriteIndex, 1);
    await user.save();
    return { added: false, wishList: user.wishList };
  } else {
    user.wishList.push(listing._id);
    await user.save();
    return { added: true, wishList: user.wishList };
  }
};

module.exports = { getUserById, updateProfile, getUserTrips, toggleWishlist };
