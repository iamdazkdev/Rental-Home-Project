const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const bookingIdSchema = {
    params: z.object({ bookingId: objectIdValidator })
};

const payVnpaySchema = {
    params: z.object({ bookingId: objectIdValidator }),
    body: z.object({ ipAddr: z.string().optional() })
};

module.exports = {
    bookingIdSchema,
    payVnpaySchema
};
