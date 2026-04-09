const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const userIdSchema = {
    params: z.object({ userId: objectIdValidator }),
    query: z.object({ unreadOnly: z.enum(["true", "false"]).optional() })
};

const notifyIdSchema = {
    params: z.object({ notificationId: objectIdValidator })
};

const userIdParamSchema = {
    params: z.object({ userId: objectIdValidator })
};

module.exports = {
    userIdSchema,
    notifyIdSchema,
    userIdParamSchema
};
