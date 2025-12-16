const router = require("express").Router();
const Listing = require("../models/Listing");
const User = require("../models/User");
const { HTTP_STATUS } = require("../constants");
const {
  upload,
  deleteCloudinaryImage,
  extractPublicId,
} = require("../services/cloudinaryService");

// CREATE LISTING
router.post("/create", upload.array("listingPhotos"), async (req, res) => {
  try {
    // Check if req.body exists and has data
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "No data provided in request body",
        error: "Request body is empty or missing",
      });
    }
    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    // Validation
    if (!req.body.category || req.body.category === "All") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Category is required and cannot be 'All'",
        error: "Invalid category",
      });
    }

    if (!req.body.type) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Property type is required",
        error: "Missing type field",
      });
    }
    // Take the form data from req.body
    const {
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bathroomCount,
      bedCount,
      amenities: amenitiesString,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    } = req.body;

    // Parse amenities from JSON string
    const amenities = amenitiesString ? JSON.parse(amenitiesString) : [];

    const listingPhotos = req.files;
    if (!listingPhotos || listingPhotos.length === 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "At least one listing photo is required" });
    }

    // Cloudinary returns secure URLs directly
    const listingPhotoPaths = listingPhotos.map((file) => file.path);

    console.log(
      "Cloudinary upload results:",
      listingPhotos.map((file) => ({
        originalname: file.originalname,
        path: file.path,
        publicId: file.filename,
      }))
    );
    const newListing = new Listing({
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bathroomCount,
      bedCount,
      amenities,
      listingPhotoPaths,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    });
    await newListing.save();
    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Listing created successfully", listing: newListing });
  } catch (error) {
    console.error("ERROR: Fail to create listing", error);
    console.error("Error stack:", error.stack);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "ERROR: Fail to create listing",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET LISTINGS
router.get("/", async (req, res) => {
  const qCategory = req.query.category;
  try {
    let listings;
    if (qCategory) {
      listings = await Listing.find({ category: qCategory }).populate(
        "creator"
      );
    } else {
      listings = await Listing.find().populate("creator");
    }
    res.status(HTTP_STATUS.OK).json(listings);
  } catch (error) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "ERROR: Fail to get listings", error: error.message });
    console.log("ERROR: Fail to get listings", error);
  }
});

// GET LISTING DETAILS
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("creator");

    if (!listing) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: "Listing not found" });
    }

    console.log("Fetched listing details:", listing);
    res.status(HTTP_STATUS.OK).json(listing);
  } catch (error) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "ERROR: Fail to get listings", error: error.message });
    console.log("ERROR: Fail to get listings", error);
  }
});


module.exports = router;
