const router = require("express").Router();
const Listing = require("../models/Listing");
const User = require("../models/User");
const {HTTP_STATUS} = require("../constants");
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
            monthlyPrice,
            pricingType,
            hostProfile: hostProfileString,
        } = req.body;

        // Parse amenities from JSON string
        const amenities = amenitiesString ? JSON.parse(amenitiesString) : [];

        // Parse host profile if provided
        let hostProfile = null;
        if (hostProfileString) {
            try {
                hostProfile = JSON.parse(hostProfileString);
                console.log("📋 Received host profile:", hostProfile);
            } catch (parseError) {
                console.error("❌ Error parsing hostProfile:", parseError);
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: "Invalid host profile data",
                    error: "Failed to parse hostProfile JSON",
                    details: parseError.message,
                });
            }
        }

        const listingPhotos = req.files;
        if (!listingPhotos || listingPhotos.length === 0) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST)
                .json({message: "At least one listing photo is required"});
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
            ...(monthlyPrice && {monthlyPrice: parseFloat(monthlyPrice)}),
            ...(pricingType && {pricingType}),
            ...(hostProfile && {hostProfile}),
        });

        console.log("💾 Saving listing with host profile:", newListing.hostProfile);
        console.log("📝 Full listing object:", JSON.stringify(newListing, null, 2));

        // Validate before saving
        const validationError = newListing.validateSync();
        if (validationError) {
            console.error("❌ Validation error:", validationError);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: "Validation error",
                error: validationError.message,
                details: validationError.errors,
            });
        }

        await newListing.save();
        res
            .status(HTTP_STATUS.CREATED)
            .json({message: "Listing created successfully", listing: newListing});
    } catch (error) {
        console.error("ERROR: Fail to create listing", error);
        console.error("Error stack:", error.stack);

        // Return JSON error response, not HTML
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: "Failed to create listing",
            error: error.message || "Unknown error",
            details: process.env.NODE_ENV === "development" ? {
                stack: error.stack,
                name: error.name,
            } : undefined,
        });
    }
});

// GET LISTINGS
router.get("/", async (req, res) => {
    const qCategory = req.query.category;
    try {
        const Booking = require("../models/Booking");

        let query = {isActive: true}; // Only show active listings
        if (qCategory) {
            query.category = qCategory;
        }

        const listings = await Listing.find(query).populate("creator");

        // Filter out listings with active bookings (prevent double booking)
        const availableListings = await Promise.all(
            listings.map(async (listing) => {
                const activeBooking = await Booking.findOne({
                    listingId: listing._id,
                    status: {$in: ["pending", "accepted"]},
                    isCheckedOut: false,
                });

                // Return listing only if no active booking
                return activeBooking ? null : listing;
            })
        );

        // Filter out null values
        const filteredListings = availableListings.filter((listing) => listing !== null);

        res.status(HTTP_STATUS.OK).json(filteredListings);
    } catch (error) {
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .json({message: "ERROR: Fail to get listings", error: error.message});
        console.log("ERROR: Fail to get listings", error);
    }
});

// GET LISTING DETAILS
router.get("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const listing = await Listing.findById(id).populate("creator");

        if (!listing) {
            return res
                .status(HTTP_STATUS.NOT_FOUND)
                .json({message: "Listing not found"});
        }

        console.log("Fetched listing details:", listing);
        res.status(HTTP_STATUS.OK).json(listing);
    } catch (error) {
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .json({message: "ERROR: Fail to get listings", error: error.message});
        console.log("ERROR: Fail to get listings", error);
    }
});

// UPDATE LISTING
router.put("/:id", upload.array("listingPhotos"), async (req, res) => {
    try {
        const {id} = req.params;

        console.log("📝 Updating listing:", id);
        console.log("📊 Request body:", req.body);
        console.log("📷 New photos:", req.files?.length || 0);

        // Find existing listing
        const existingListing = await Listing.findById(id);
        if (!existingListing) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: "Listing not found",
            });
        }

        // Parse amenities if it's a string
        let amenities = req.body.amenities;
        if (typeof amenities === "string") {
            try {
                amenities = JSON.parse(amenities);
            } catch (e) {
                console.log("Amenities is already an array or simple value");
            }
        }

        // Prepare update data
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            price: req.body.price,
            streetAddress: req.body.streetAddress,
            aptSuite: req.body.aptSuite || "",
            city: req.body.city,
            province: req.body.province,
            country: req.body.country,
            bedroomCount: parseInt(req.body.bedroomCount) || 1,
            bedCount: parseInt(req.body.bedCount) || 1,
            bathroomCount: parseInt(req.body.bathroomCount) || 1,
            guestCount: parseInt(req.body.guestCount) || 1,
            amenities: amenities || [],
        };

        // Add new photos if provided
        if (req.files && req.files.length > 0) {
            const newPhotoPaths = req.files.map((file) => file.path);
            updateData.listingPhotoPaths = [
                ...existingListing.listingPhotoPaths,
                ...newPhotoPaths,
            ];
        }

        console.log("✅ Update data prepared:", updateData);

        // Update the listing
        const updatedListing = await Listing.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        console.log("✅ Listing updated successfully");

        res.status(HTTP_STATUS.OK).json({
            message: "Listing updated successfully",
            listing: updatedListing,
        });
    } catch (error) {
        console.error("❌ Error updating listing:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: "Failed to update listing",
            error: error.message,
        });
    }
});


module.exports = router;
