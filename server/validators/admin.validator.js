const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const adminIdParamSchema = {
    params: z.object({ adminId: objectIdValidator })
};

const adminUsersQuerySchema = {
    params: z.object({ adminId: objectIdValidator }),
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).optional(),
        search: z.string().optional(),
        role: z.string().optional()
    })
};

const adminRoleSchema = {
    params: z.object({
        adminId: objectIdValidator,
        userId: objectIdValidator
    }),
    body: z.object({
        role: z.enum(["user", "admin"])
    })
};

const adminUserActionSchema = {
    params: z.object({
        adminId: objectIdValidator,
        userId: objectIdValidator
    })
};

const adminListingsQuerySchema = {
    params: z.object({ adminId: objectIdValidator }),
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).optional(),
        status: z.enum(["active", "inactive", ""]).optional()
    })
};

const adminListingActionSchema = {
    params: z.object({
        adminId: objectIdValidator,
        listingId: objectIdValidator
    })
};

module.exports = {
    adminIdParamSchema,
    adminUsersQuerySchema,
    adminRoleSchema,
    adminUserActionSchema,
    adminListingsQuerySchema,
    adminListingActionSchema
};
