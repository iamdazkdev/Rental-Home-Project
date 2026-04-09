const propertyService = require("../services/propertyManagement.service");
const { HTTP_STATUS } = require("../constants");

const getUserProperties = async (req, res) => {
    const { userId } = req.params;
    const { includeHidden } = req.query;
    const properties = await propertyService.getUserProperties(userId, includeHidden);
    res.status(HTTP_STATUS.OK).json(properties);
};

const updateListing = async (req, res) => {
    const { listingId } = req.params;
    const updateData = req.body;
    const listing = await propertyService.updateListing(listingId, updateData);
    res.status(HTTP_STATUS.OK).json({ message: "Listing updated successfully", listing });
};

const toggleVisibility = async (req, res) => {
    const { listingId } = req.params;
    const listing = await propertyService.toggleVisibility(listingId);
    res.status(HTTP_STATUS.OK).json({
        message: listing.isActive ? "Listing is now visible" : "Listing is now hidden",
        listing
    });
};

const deleteListing = async (req, res) => {
    const { listingId } = req.params;
    try {
        await propertyService.deleteListing(listingId);
        res.status(HTTP_STATUS.OK).json({ message: "Listing deleted successfully" });
    } catch (error) {
        if (error.hasActiveBooking) {
            return res.status(error.statusCode).json({ message: error.message, hasActiveBooking: true });
        }
        throw error;
    }
};

const checkAvailability = async (req, res) => {
    const { listingId } = req.params;
    const activeBooking = await propertyService.checkAvailability(listingId);
    res.status(HTTP_STATUS.OK).json({
        hasActiveBooking: !!activeBooking,
        activeBooking: activeBooking || null
    });
};

module.exports = {
    getUserProperties,
    updateListing,
    toggleVisibility,
    deleteListing,
    checkAvailability
};
