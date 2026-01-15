const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const BlockedDate = require('../models/BlockedDate');
const CustomPrice = require('../models/CustomPrice');
const Listing = require('../models/Listing');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/calendar/:listingId
 * @desc    Get calendar data for a specific listing (bookings, blocked dates, custom prices)
 * @access  Private (Host only)
 */
router.get('/:listingId', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { month, year } = req.query;

    // Validate req.user exists
    if (!req.user || !req.user.id) {
      logger.error('Calendar request failed: req.user or req.user.id is undefined');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed - user not found in request'
      });
    }

    const userId = req.user.id;
    logger.calendar(`Fetching calendar for listing ${listingId} by user ${userId}`);

    // Verify listing ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      logger.warn(`Listing ${listingId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.creator.toString() !== userId.toString()) {
      logger.warn(`User ${userId} unauthorized to view calendar for listing ${listingId}`);
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this calendar'
      });
    }

    // Calculate date range
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    logger.calendar(`Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch bookings
    const bookings = await Booking.find({
      listingId,
      $or: [
        { startDate: { $lte: endDate.toISOString() } },
        { endDate: { $gte: startDate.toISOString() } }
      ],
      bookingStatus: { $nin: ['cancelled', 'rejected', 'expired'] }
    })
    .populate('customerId', 'name email profilePicture phoneNumber')
    .sort({ startDate: 1 });

    // Filter out bookings without valid customer (orphaned bookings)
    const validBookings = bookings.filter(booking => {
      if (!booking.customerId || !booking.customerId._id) {
        logger.warn(`⚠️ Skipping orphaned booking ${booking._id} - no customer data`);
        return false;
      }
      return true;
    });

    logger.calendar(`Found ${bookings.length} bookings (${validBookings.length} valid, ${bookings.length - validBookings.length} skipped)`);

    // Fetch blocked dates
    const blockedDates = await BlockedDate.find({
      listingId,
      isActive: true,
      $or: [
        { startDate: { $lte: endDate } },
        { endDate: { $gte: startDate } }
      ]
    }).sort({ startDate: 1 });

    // Fetch custom prices
    const customPrices = await CustomPrice.find({
      listingId,
      isActive: true,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        listing: {
          id: listing._id,
          title: listing.title,
          basePrice: listing.price
        },
        period: {
          month: targetMonth + 1,
          year: targetYear,
          startDate,
          endDate
        },
        bookings: validBookings.map(booking => {
          const customer = booking.customerId;
          return {
            id: booking._id,
            customerId: customer._id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phoneNumber || null,
            customerAvatar: customer.profilePicture || null,
            checkIn: new Date(booking.startDate).toISOString(),
            checkOut: new Date(booking.endDate).toISOString(),
            status: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            totalPrice: booking.totalPrice,
            numberOfGuests: booking.numberOfGuests || 1
          };
        }),
        blockedDates: blockedDates.map(block => ({
          id: block._id,
          startDate: new Date(block.startDate).toISOString(),
          endDate: new Date(block.endDate).toISOString(),
          reason: block.reason,
          note: block.note,
          recurring: block.recurring
        })),
        customPrices: customPrices.map(cp => ({
          id: cp._id,
          date: new Date(cp.date).toISOString(),
          price: cp.price,
          reason: cp.reason
        }))
      }
    });

    logger.success(`Calendar data fetched: ${validBookings.length} bookings, ${blockedDates.length} blocked dates, ${customPrices.length} custom prices`);

  } catch (error) {
    logger.error('Error fetching calendar data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar data',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/calendar/:listingId/block
 * @desc    Block dates for a listing
 * @access  Private (Host only)
 */
router.post('/:listingId/block', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { startDate, endDate, reason, note, recurring } = req.body;

    const userId = req.user.id;

    // Verify listing ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to block dates for this listing'
      });
    }

    // ...existing code for validation...

    // Create blocked date
    const blockedDate = await BlockedDate.create({
      listingId,
      hostId: userId,
      startDate: start,
      endDate: end,
      reason: reason || 'personal',
      note,
      recurring: recurring || { enabled: false }
    });

    logger.calendar(`Host ${userId} blocked dates for listing ${listingId}: ${start.toISOString()} to ${end.toISOString()}`);

    res.status(201).json({
      success: true,
      message: 'Dates blocked successfully',
      data: blockedDate
    });

  } catch (error) {
    console.error('❌ Error blocking dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block dates',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/calendar/:listingId/block/:blockId
 * @desc    Unblock dates
 * @access  Private (Host only)
 */
router.delete('/:listingId/block/:blockId', authenticateToken, async (req, res) => {
  try {
    const { listingId, blockId } = req.params;
    const userId = req.user.id;

    const blockedDate = await BlockedDate.findById(blockId);

    if (!blockedDate) {
      return res.status(404).json({
        success: false,
        message: 'Blocked date not found'
      });
    }

    if (blockedDate.hostId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to unblock these dates'
      });
    }

    await BlockedDate.findByIdAndDelete(blockId);

    logger.success(`Host ${userId} unblocked dates ${blockId}`);

    res.json({
      success: true,
      message: 'Dates unblocked successfully'
    });

  } catch (error) {
    logger.error('Error unblocking dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock dates',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/calendar/:listingId/pricing
 * @desc    Set custom price for specific date
 * @access  Private (Host only)
 */
router.post('/:listingId/pricing', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { date, price, reason } = req.body;
    const userId = req.user.id;

    // Verify listing ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to set prices for this listing'
      });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Upsert custom price
    const customPrice = await CustomPrice.findOneAndUpdate(
      { listingId, date: targetDate },
      {
        hostId: userId,
        price,
        reason,
        isActive: true
      },
      { upsert: true, new: true }
    );

    logger.payment(`Host ${userId} set custom price for listing ${listingId}: ${targetDate.toISOString()} = ${price}`);

    res.status(201).json({
      success: true,
      message: 'Custom price set successfully',
      data: customPrice
    });

  } catch (error) {
    logger.error('Error setting custom price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set custom price',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/calendar/:listingId/pricing/:priceId
 * @desc    Remove custom price
 * @access  Private (Host only)
 */
router.delete('/:listingId/pricing/:priceId', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.params;
    const userId = req.user.id;

    const customPrice = await CustomPrice.findById(priceId);

    if (!customPrice) {
      return res.status(404).json({
        success: false,
        message: 'Custom price not found'
      });
    }

    if (customPrice.hostId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove this custom price'
      });
    }

    await CustomPrice.findByIdAndDelete(priceId);

    logger.success(`Host ${userId} removed custom price ${priceId}`);

    res.json({
      success: true,
      message: 'Custom price removed successfully'
    });

  } catch (error) {
    logger.error('Error removing custom price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom price',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/calendar/availability/:listingId
 * @desc    Check availability for a listing (public endpoint)
 * @access  Public
 */
router.get('/availability/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { startDate, endDate } = req.query;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for bookings
    const bookings = await Booking.find({
      listingId,
      bookingStatus: { $nin: ['cancelled', 'rejected', 'expired'] },
      $or: [
        { startDate: { $lte: end.toISOString() }, endDate: { $gte: start.toISOString() } }
      ]
    });

    // Check for blocked dates
    const blockedDates = await BlockedDate.find({
      listingId,
      isActive: true,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    const isAvailable = bookings.length === 0 && blockedDates.length === 0;

    res.json({
      success: true,
      data: {
        isAvailable,
        bookings: bookings.length,
        blockedPeriods: blockedDates.length
      }
    });

  } catch (error) {
    console.error('❌ Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
});

module.exports = router;

