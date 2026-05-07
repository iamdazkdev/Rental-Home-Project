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
    limit: z.coerce.number().min(1).default(20),
    // New parameters for Long Term Rental
    rentalMode: z.enum(['short_term', 'long_term']).default('short_term'),
    duration: z.coerce.number().min(1).max(12).optional(),
    searchMode: z.enum(['exact', 'flexible']).optional(),
    startDate: z.string().datetime().optional(),
    flexibleMonths: z.union([z.string(), z.array(z.coerce.number())]).optional()
  })
};

module.exports = { searchSchema };
