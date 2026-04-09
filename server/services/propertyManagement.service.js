const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const { HTTP_STATUS } = require("../constants");

class PropertyManagementService {
    async getUserProperties(userId, includeHidden) {
        const query = { creator: userId };
        if (!includeHidden || includeHidden === "false") {
            query.isActive = true;
        }

        const properties = await Listing.find(query)
            .populate("creator", "firstName lastName email profileImagePath")
            .sort({ createdAt: -1 });

        return await Promise.all(
            properties.map(async (property) => {
                const activeBooking = await Booking.findOne({
                    listingId: property._id,
                    bookingStatus: { $in: ["pending", "approved", "checked_in"] },
                    isCheckedOut: false,
                });

                return {
                    ...property.toObject(),
                    hasActiveBooking: !!activeBooking,
                    activeBooking: activeBooking || null,
                };
            })
        );
    }

    async updateListing(listingId, updateData) {
        delete updateData.creator;
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const listing = await Listing.findByIdAndUpdate(listingId, updateData, { new: true })
            .populate("creator", "firstName lastName email");

        if (!listing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return listing;
    }

    async toggleVisibility(listingId) {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        listing.isActive = !listing.isActive;
        await listing.save();
        return listing;
    }

    async deleteListing(listingId) {
        const activeBooking = await Booking.findOne({
            listingId,
            bookingStatus: { $in: ["pending", "approved", "checked_in"] },
            isCheckedOut: false,
        });

        if (activeBooking) {
            const error = new Error("Cannot delete listing with active bookings. Please wait until all bookings are completed.");
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            error.hasActiveBooking = true;
            throw error;
        }

        const deletedListing = await Listing.findByIdAndDelete(listingId);
        if (!deletedListing) {
            const error = new Error("Listing not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
    }

    async checkAvailability(listingId) {
        return await Booking.findOne({
            listingId,
            bookingStatus: { $in: ["pending", "approved", "checked_in"] },
            isCheckedOut: false,
        }).populate("customerId", "firstName lastName email").populate("listingId", "title");
    }
}

module.exports = new PropertyManagementService();
