const router = require("express").Router();
const multer = require("multer");
const Listing = require("../models/Listing");
const User = require("../models/User");
const { HTTP_STATUS } = require("../constants");
// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in 'public/uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename to avoid conflicts
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

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
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: "At least one listing photo is required" });
    }
    const listingPhotoPaths = listingPhotos.map((file) => file.path);
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
      await Listing.find();
    }
    res.status(HTTP_STATUS.OK).json(listings);
  } catch (error) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "ERROR: Fail to get listings", error: error.message });
    console.log("ERROR: Fail to get listings", error);
  }
});

module.exports = router;
