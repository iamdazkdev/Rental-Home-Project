const { executeSearch } = require("../services/search.service");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const BlockedDate = require("../models/BlockedDate");
const Review = require("../models/Review");

// Mock Mongoose models
jest.mock("../models/Listing");
jest.mock("../models/Booking");
jest.mock("../models/BlockedDate");
jest.mock("../models/Review");

describe("Search Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockListings = [
    {
      _id: "listing1",
      title: "Nice room",
      isActive: true,
      price: 100,
      createdAt: new Date(),
      toObject: function () {
        return { ...this, toObject: undefined };
      },
    },
  ];

  it("should return listings for short_term rental (default)", async () => {
    Listing.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockListings),
    });
    Booking.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    BlockedDate.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    Review.find.mockResolvedValue([]);

    const filters = { page: 1, limit: 10 };
    const result = await executeSearch(filters);

    expect(result.listings.length).toBe(1);
    expect(result.listings[0]._id).toBe("listing1");
    expect(result.pagination.total).toBe(1);
  });

  it("should calculate exact mode long_term rental correctly", async () => {
    Listing.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockListings),
    });
    Booking.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    BlockedDate.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    Review.find.mockResolvedValue([]);

    const filters = {
      page: 1,
      limit: 10,
      rentalMode: "long_term",
      duration: 2,
      searchMode: "exact",
      startDate: new Date().toISOString(),
    };
    
    const result = await executeSearch(filters);

    expect(result.listings.length).toBe(1);
    expect(result.listings[0].availableDuration).toBe(365);
    expect(result.listings[0].finalScore).toBeGreaterThan(0);
  });
  
  it("should calculate flexible mode long_term rental correctly", async () => {
    Listing.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockListings),
    });
    Booking.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    BlockedDate.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    Review.find.mockResolvedValue([]);

    const filters = {
      page: 1,
      limit: 10,
      rentalMode: "long_term",
      duration: 3,
      searchMode: "flexible",
      flexibleMonths: "5,6",
    };
    
    const result = await executeSearch(filters);

    expect(result.listings.length).toBe(1);
    expect(result.listings[0].availableDuration).toBe(365);
    expect(result.listings[0].finalScore).toBeGreaterThan(0);
  });
});
