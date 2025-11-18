const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "rental-home-listings", // Organize images in folders
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1200, height: 800, crop: "fill", quality: "auto:good" }, // Optimize images
    ],
    public_id: (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return `listing_${timestamp}_${random}`;
    },
  },
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Helper function to delete images from Cloudinary
const deleteCloudinaryImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted image from Cloudinary:", publicId, result);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  try {
    // Extract public_id from URL like: https://res.cloudinary.com/xxx/image/upload/v1234567890/folder/public_id.jpg
    const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

// Helper function to get optimized image URL
const getOptimizedImageUrl = (publicId, transformation = {}) => {
  const defaultTransformation = {
    quality: "auto:good",
    fetch_format: "auto",
    ...transformation,
  };

  return cloudinary.url(publicId, defaultTransformation);
};

module.exports = {
  cloudinary,
  upload,
  deleteCloudinaryImage,
  extractPublicId,
  getOptimizedImageUrl,
  storage,
};
