const Booking = require('../models/Booking');
const BlockedDate = require('../models/BlockedDate');
const CustomPrice = require('../models/CustomPrice');
const Listing = require('../models/Listing');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require("../constants");

class CalendarService {
    async getCalendarData(listingId, userId, targetMonth, targetYear) {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (listing.creator.toString() !== userId.toString()) {
            const error = new Error("You are not authorized to view this calendar");
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

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

        const validBookings = bookings.filter(booking => {
            if (!booking.customerId || !booking.customerId._id) return false;
            return true;
        });

        const blockedDates = await BlockedDate.find({
            listingId,
            isActive: true,
            $or: [
                { startDate: { $lte: endDate } },
                { endDate: { $gte: startDate } }
            ]
        }).sort({ startDate: 1 });

        const customPrices = await CustomPrice.find({
            listingId,
            isActive: true,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        return { listing, startDate, endDate, validBookings, blockedDates, customPrices, targetMonth, targetYear };
    }

    async blockDates(listingId, userId, startDate, endDate, reason, note, recurring) {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (listing.creator.toString() !== userId.toString()) {
            const error = new Error("You are not authorized to block dates for this listing");
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        const blockedDate = await BlockedDate.create({
            listingId,
            hostId: userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason: reason || 'personal',
            note,
            recurring: recurring || { enabled: false }
        });

        return blockedDate;
    }

    async unblockDates(blockId, userId) {
        const blockedDate = await BlockedDate.findById(blockId);
        if (!blockedDate) {
            const error = new Error("Blocked date not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (blockedDate.hostId.toString() !== userId.toString()) {
            const error = new Error("You are not authorized to unblock these dates");
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        await BlockedDate.findByIdAndDelete(blockId);
    }

    async setPricing(listingId, userId, date, price, reason) {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (listing.creator.toString() !== userId.toString()) {
            const error = new Error("You are not authorized to set prices for this listing");
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const customPrice = await CustomPrice.findOneAndUpdate(
            { listingId, date: targetDate },
            { hostId: userId, price, reason, isActive: true },
            { upsert: true, new: true }
        );

        return customPrice;
    }

    async removePricing(priceId, userId) {
        const customPrice = await CustomPrice.findById(priceId);
        if (!customPrice) {
            const error = new Error("Custom price not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (customPrice.hostId.toString() !== userId.toString()) {
            const error = new Error("You are not authorized to remove this custom price");
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        await CustomPrice.findByIdAndDelete(priceId);
    }

    async checkAvailability(listingId, startDate, endDate) {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const bookings = await Booking.find({
            listingId,
            bookingStatus: { $nin: ['cancelled', 'rejected', 'expired'] },
            $or: [
                { startDate: { $lte: end.toISOString() }, endDate: { $gte: start.toISOString() } }
            ]
        });

        const blockedDates = await BlockedDate.find({
            listingId,
            isActive: true,
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        const isAvailable = bookings.length === 0 && blockedDates.length === 0;

        return { isAvailable, bookingsCount: bookings.length, blockedPeriodsCount: blockedDates.length };
    }
}

module.exports = new CalendarService();
