const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const createReviewSchema = {
    body: z.object({
        bookingId: objectIdValidator,
        reviewerId: objectIdValidator,
        listingRating: z.coerce.number().min(1).max(5),
        listingComment: z.string().optional(),
        hostRating: z.coerce.number().min(1).max(5).optional(),
        hostComment: z.string().optional(),
        guestRating: z.coerce.number().min(1).max(5).optional(),
        guestComment: z.string().optional(),
    })
};

const getListingReviewsSchema = {
    params: z.object({ listingId: objectIdValidator }),
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).optional()
    })
};

const userIdSchema = {
    params: z.object({ userId: objectIdValidator })
};

const updateReviewSchema = {
    params: z.object({ reviewId: objectIdValidator }),
    body: z.object({
        listingRating: z.coerce.number().min(1).max(5).optional(),
        listingComment: z.string().optional(),
        hostRating: z.coerce.number().min(1).max(5).optional(),
        hostComment: z.string().optional(),
        guestRating: z.coerce.number().min(1).max(5).optional(),
        guestComment: z.string().optional(),
    })
};

const reviewIdSchema = {
    params: z.object({ reviewId: objectIdValidator })
};

module.exports = {
    createReviewSchema,
    getListingReviewsSchema,
    userIdSchema,
    updateReviewSchema,
    reviewIdSchema
};
