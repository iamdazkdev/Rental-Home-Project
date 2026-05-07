const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const BlockedDate = require("../models/BlockedDate");

const calculateMinDuration = (duration) => {
  if (!duration) return 0;
  if (duration === 1) return 24; 
  return (duration - 1) * 30 + 1; 
};

const getListingAvailabilities = async (listingIds, fromDate) => {
  const bookings = await Booking.find({
    listingId: { $in: listingIds },
    endDate: { $gte: fromDate },
    bookingStatus: { $in: ["pending", "approved", "checked_in"] },
    isCheckedOut: false,
  }).lean();

  const blockedDates = await BlockedDate.find({
    listingId: { $in: listingIds },
    endDate: { $gte: fromDate },
    isActive: true,
  }).lean();

  const availabilities = {};
  listingIds.forEach(id => {
    availabilities[id.toString()] = { bookings: [], blockedDates: [] };
  });

  bookings.forEach(b => {
    if(availabilities[b.listingId.toString()]) {
      availabilities[b.listingId.toString()].bookings.push(b);
    }
  });
  blockedDates.forEach(b => {
    if(availabilities[b.listingId.toString()]) {
      availabilities[b.listingId.toString()].blockedDates.push(b);
    }
  });

  return availabilities;
};

const calculateAvailability = (listingId, availabilities, targetStartDate) => {
  const listingAvail = availabilities[listingId.toString()];
  if (!listingAvail) return { availableFrom: targetStartDate, availableDuration: 365 };

  let currentStart = new Date(targetStartDate);
  currentStart.setHours(0,0,0,0);
  
  const intervals = [];
  listingAvail.bookings.forEach(b => intervals.push({ start: new Date(b.startDate), end: new Date(b.endDate) }));
  listingAvail.blockedDates.forEach(b => intervals.push({ start: new Date(b.startDate), end: new Date(b.endDate) }));

  intervals.sort((a, b) => a.start - b.start);

  const merged = [];
  if (intervals.length > 0) {
    let current = { start: new Date(intervals[0].start), end: new Date(intervals[0].end) };
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].start <= current.end) {
        current.end = new Date(Math.max(current.end, intervals[i].end));
      } else {
        merged.push(current);
        current = { start: new Date(intervals[i].start), end: new Date(intervals[i].end) };
      }
    }
    merged.push(current);
  }

  let availableFrom = new Date(currentStart);
  let availableDuration = 365;

  for (const interval of merged) {
    if (availableFrom < interval.start) {
      availableDuration = Math.floor((interval.start - availableFrom) / (1000 * 60 * 60 * 24));
      return { availableFrom, availableDuration };
    } else if (availableFrom <= interval.end) {
      availableFrom = new Date(interval.end);
      availableFrom.setDate(availableFrom.getDate() + 1);
      availableFrom.setHours(0,0,0,0);
    }
  }

  return { availableFrom, availableDuration: 365 }; 
};

const calculateScoring = (availableFrom, availableDuration, requestedStartDate, requestedDurationMonths) => {
  const reqDurationDays = requestedDurationMonths * 30;
  
  let durationScore = Math.min(1, availableDuration / reqDurationDays);
  
  let dateScore = 0;
  const availFromTime = new Date(availableFrom).getTime();
  const reqStartTime = new Date(requestedStartDate).getTime();
  
  if (availFromTime <= reqStartTime) {
    dateScore = 1.0;
  } else {
    const daysLate = (availFromTime - reqStartTime) / (1000 * 60 * 60 * 24);
    if (daysLate <= 7) {
      dateScore = 1 - (daysLate / 7);
    } else {
      dateScore = 0;
    }
  }
  
  return { durationScore, dateScore };
};

const executeSearch = async (filters) => {
  const {
    query, city, province, country, category, type, minPrice, maxPrice,
    minGuests, minBedrooms, minBathrooms, amenities, minRating, sortBy, page, limit,
    rentalMode, duration, searchMode, startDate, flexibleMonths
  } = filters;

  // Build query
  let searchQuery = { isActive: true };

  // Text search
  if (query) {
    searchQuery.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { city: { $regex: query, $options: "i" } },
      { province: { $regex: query, $options: "i" } },
      { country: { $regex: query, $options: "i" } },
    ];
  }

  // Location filters
  if (city) searchQuery.city = { $regex: city, $options: "i" };
  if (province) searchQuery.province = { $regex: province, $options: "i" };
  if (country) searchQuery.country = { $regex: country, $options: "i" };

  // Category & Type
  if (category && category !== "All") searchQuery.category = category;
  if (type) searchQuery.type = type;

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    if (minPrice !== undefined) searchQuery.price.$gte = minPrice;
    if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice;
  }

  // Capacity filters
  if (minGuests !== undefined) searchQuery.guestCount = { $gte: minGuests };
  if (minBedrooms !== undefined) searchQuery.bedroomCount = { $gte: minBedrooms };
  if (minBathrooms !== undefined) searchQuery.bathroomCount = { $gte: minBathrooms };

  // Amenities filter
  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    searchQuery.amenities = { $all: amenitiesArray };
  }

  // Execute base query
  let listings = await Listing.find(searchQuery).populate("creator");
  
  const listingIds = listings.map(l => l._id);
  const targetDate = startDate ? new Date(startDate) : new Date();
  
  // Calculate average rating
  const listingsWithRating = await Promise.all(
    listings.map(async (listing) => {
      const reviews = await Review.find({ listingId: listing._id, listingRating: { $gt: 0 } });
      const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.listingRating, 0) / reviews.length : 0;
      return { ...listing.toObject(), averageRating, reviewCount: reviews.length };
    })
  );
  
  listings = listingsWithRating;

  // Filter by minimum rating
  if (minRating !== undefined) {
    listings = listings.filter((item) => item.averageRating >= minRating);
  }

  // Handle Search Mode Logic (Short term vs Long term)
  const availabilities = await getListingAvailabilities(listingIds, new Date()); // fetch from today
  
  if (rentalMode === 'long_term' && duration) {
    const minDuration = calculateMinDuration(duration);
    
    if (searchMode === 'exact' && startDate) {
      const requestedStartDate = new Date(startDate);
      requestedStartDate.setHours(0,0,0,0);
      
      listings = listings.map(listing => {
        const { availableFrom, availableDuration } = calculateAvailability(listing._id, availabilities, requestedStartDate);
        
        if (availableDuration < minDuration) return null;
        
        const { durationScore, dateScore } = calculateScoring(availableFrom, availableDuration, requestedStartDate, duration);
        const otherScore = Math.min(1, listing.averageRating / 5);
        const finalScore = (durationScore * 0.6) + (dateScore * 0.3) + (otherScore * 0.1);
        
        const displayStartDate = availableFrom <= requestedStartDate ? requestedStartDate : availableFrom;
        
        return { ...listing, finalScore, availableFrom, availableDuration, displayStartDate };
      }).filter(Boolean);
      
      // Sort by finalScore
      listings.sort((a, b) => b.finalScore - a.finalScore);
      
    } else if (searchMode === 'flexible') {
      let flexMonths = [];
      if (typeof flexibleMonths === 'string') flexMonths = flexibleMonths.split(',').map(Number);
      else if (Array.isArray(flexibleMonths)) flexMonths = flexibleMonths;
      
      const searchPoints = [];
      const currentYear = new Date().getFullYear();
      flexMonths.forEach(month => {
        [1, 5, 10, 15, 20, 25].forEach(day => {
          searchPoints.push(new Date(currentYear, month - 1, day));
        });
      });
      
      const bestListingsMap = new Map();
      
      listings.forEach(listing => {
        let bestOption = null;
        
        searchPoints.forEach(point => {
          const { availableFrom, availableDuration } = calculateAvailability(listing._id, availabilities, point);
          if (availableDuration >= minDuration) {
            const { durationScore, dateScore } = calculateScoring(availableFrom, availableDuration, point, duration);
            const otherScore = Math.min(1, listing.averageRating / 5);
            const finalScore = (durationScore * 0.6) + (dateScore * 0.3) + (otherScore * 0.1);
            
            if (!bestOption || finalScore > bestOption.finalScore) {
              const displayStartDate = availableFrom <= point ? point : availableFrom;
              bestOption = { ...listing, finalScore, availableFrom, availableDuration, displayStartDate, searchedPoint: point };
            }
          }
        });
        
        if (bestOption) {
          bestListingsMap.set(listing._id.toString(), bestOption);
        }
      });
      
      listings = Array.from(bestListingsMap.values());
      listings.sort((a, b) => b.finalScore - a.finalScore);
    }
  } else {
    // Short term logic
    listings = listings.filter(listing => {
      const activeBooking = availabilities[listing._id.toString()]?.bookings?.find(b => {
         const now = new Date();
         return new Date(b.startDate) <= now && new Date(b.endDate) >= now;
      });
      return !activeBooking;
    });

    // Sort results
    if (sortBy) {
      switch (sortBy) {
        case "price_asc":
          listings.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          listings.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          listings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
        case "newest":
          listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        default:
          listings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      }
    }
  }

  // Pagination
  const total = listings.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = listings.slice(startIndex, endIndex);

  return {
    listings: paginatedListings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };
};

module.exports = { executeSearch };
