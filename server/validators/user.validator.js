const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format"
});

const getUserSchema = {
  params: z.object({ userId: objectIdValidator })
};

const updateProfileSchema = {
  params: z.object({ userId: objectIdValidator }),
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    hostBio: z.string().optional()
  })
};

const getTripsSchema = {
  params: z.object({ userId: objectIdValidator })
};

const toggleWishlistSchema = {
  params: z.object({
    userId: objectIdValidator,
    listingId: objectIdValidator
  })
};

module.exports = { getUserSchema, updateProfileSchema, getTripsSchema, toggleWishlistSchema };
