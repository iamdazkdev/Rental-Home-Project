const calendarService = require("../services/calendar.service");
const logger = require("../utils/logger");
const { HTTP_STATUS } = require("../constants");

const getCalendarData = async (req, res) => {
    const { listingId } = req.params;
    const { month, year } = req.query;
    const userId = req.user.id;

    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const data = await calendarService.getCalendarData(listingId, userId, targetMonth, targetYear);
    
    res.json({
        success: true,
        data: {
            listing: {
                id: data.listing._id,
                title: data.listing.title,
                basePrice: data.listing.price
            },
            period: {
                month: data.targetMonth + 1,
                year: data.targetYear,
                startDate: data.startDate,
                endDate: data.endDate
            },
            bookings: data.validBookings.map(booking => {
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
            blockedDates: data.blockedDates.map(block => ({
                id: block._id,
                startDate: new Date(block.startDate).toISOString(),
                endDate: new Date(block.endDate).toISOString(),
                reason: block.reason,
                note: block.note,
                recurring: block.recurring
            })),
            customPrices: data.customPrices.map(cp => ({
                id: cp._id,
                date: new Date(cp.date).toISOString(),
                price: cp.price,
                reason: cp.reason
            }))
        }
    });
};

const blockDates = async (req, res) => {
    const { listingId } = req.params;
    const { startDate, endDate, reason, note, recurring } = req.body;
    const userId = req.user.id;

    const blockedDate = await calendarService.blockDates(listingId, userId, startDate, endDate, reason, note, recurring);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Dates blocked successfully',
        data: blockedDate
    });
};

const unblockDates = async (req, res) => {
    const { blockId } = req.params;
    const userId = req.user.id;

    await calendarService.unblockDates(blockId, userId);

    res.json({
        success: true,
        message: 'Dates unblocked successfully'
    });
};

const setPricing = async (req, res) => {
    const { listingId } = req.params;
    const { date, price, reason } = req.body;
    const userId = req.user.id;

    const customPrice = await calendarService.setPricing(listingId, userId, date, price, reason);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Custom price set successfully',
        data: customPrice
    });
};

const removePricing = async (req, res) => {
    const { priceId } = req.params;
    const userId = req.user.id;

    await calendarService.removePricing(priceId, userId);

    res.json({
        success: true,
        message: 'Custom price removed successfully'
    });
};

const checkAvailability = async (req, res) => {
    const { listingId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await calendarService.checkAvailability(listingId, startDate, endDate);

    res.json({
        success: true,
        data: {
            isAvailable: result.isAvailable,
            bookings: result.bookingsCount,
            blockedPeriods: result.blockedPeriodsCount
        }
    });
};

module.exports = {
    getCalendarData,
    blockDates,
    unblockDates,
    setPricing,
    removePricing,
    checkAvailability
};
