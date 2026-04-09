const { z } = require("zod");

const searchSchema = {
  query: z.object({
    query: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    category: z.string().optional(),
    type: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    minGuests: z.coerce.number().optional(),
    minBedrooms: z.coerce.number().optional(),
    minBathrooms: z.coerce.number().optional(),
    amenities: z.union([z.string(), z.array(z.string())]).optional(),
    minRating: z.coerce.number().optional(),
    sortBy: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(20)
  })
};

module.exports = { searchSchema };
