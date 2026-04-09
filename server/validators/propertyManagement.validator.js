const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const userIdSchema = {
    params: z.object({ userId: objectIdValidator }),
    query: z.object({ includeHidden: z.enum(["true", "false"]).optional() })
};

const listingIdSchema = {
    params: z.object({ listingId: objectIdValidator })
};

const updateListingSchema = {
    params: z.object({ listingId: objectIdValidator }),
    body: z.record(z.any())
};

module.exports = {
    userIdSchema,
    listingIdSchema,
    updateListingSchema
};
