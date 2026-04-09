const listingService = require("../services/listing.service");
const { HTTP_STATUS } = require("../constants");

const createListing = async (req, res) => {
  const listing = await listingService.createListing(req.body, req.files);
  res.status(HTTP_STATUS.CREATED).json({
    message: "Listing created successfully",
    listing
  });
};

const getListings = async (req, res) => {
  const listings = await listingService.getListings(req.query.category);
  res.status(HTTP_STATUS.OK).json(listings);
};

const getListingById = async (req, res) => {
  const listing = await listingService.getListingById(req.params.id);
  if (!listing) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Listing not found" });
  }
  res.status(HTTP_STATUS.OK).json(listing);
};

const updateListing = async (req, res) => {
  const listing = await listingService.updateListing(req.params.id, req.body, req.files);
  res.status(HTTP_STATUS.OK).json({
    message: "Listing updated successfully",
    listing
  });
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing
};
