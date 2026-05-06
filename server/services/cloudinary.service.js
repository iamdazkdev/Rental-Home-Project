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
    // Log detailed file info for debugging
    console.log("📁 File upload attempt:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding,
      size: file.size || 'unknown',
    });

    // For debugging - log all headers
    console.log("📋 Request headers:", {
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
    });

    // Accepted image mimetypes (comprehensive list)
    const acceptedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      "application/octet-stream", // Mobile apps often send this
      "binary/octet-stream",      // Alternative format
    ];

    // Very permissive check - accept if:
    // 1. Mimetype starts with 'image/'
    // 2. Mimetype is in accepted list
    // 3. Has image file extension
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp|tiff)$/i.test(file.originalname);

    const isValidImage =
      file.mimetype.startsWith("image/") ||
      acceptedMimeTypes.includes(file.mimetype) ||
      hasImageExtension;

    if (isValidImage) {
      console.log("✅ File accepted:", {
        filename: file.originalname,
        mimetype: file.mimetype,
        reason: file.mimetype.startsWith("image/")
          ? "valid image mimetype"
          : hasImageExtension
          ? "valid file extension"
          : "in accepted list"
      });
      cb(null, true);
    } else {
      console.log("❌ File rejected:", {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: file.originalname.split('.').pop(),
      });
      cb(
        new Error(
          `Only image files are allowed! Received: ${file.mimetype} for file: ${file.originalname}`
        ),
        false
      );
    }
  },
});

// Create Cloudinary storage for user profile images
const userProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "rental-home-users", // Separate folder for user profiles
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face", quality: "auto:good" }, // Square profile pic
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return `profile_${timestamp}_${random}`;
    },
  },
});

// Create multer upload middleware for user profiles
const uploadUserProfile = multer({
  storage: userProfileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pics
    files: 1, // Only 1 file
  },
  fileFilter: (req, file, cb) => {
    console.log("📁 Profile image upload attempt:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    const acceptedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/octet-stream",
    ];

    const hasImageExtension = /\.(jpg|jpeg|png|webp)$/i.test(file.originalname);
    const isValidImage =
      file.mimetype.startsWith("image/") ||
      acceptedMimeTypes.includes(file.mimetype) ||
      hasImageExtension;

    if (isValidImage) {
      console.log("✅ Profile image accepted");
      cb(null, true);
    } else {
      console.log("❌ Profile image rejected");
      cb(new Error(`Only image files are allowed!`), false);
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

/**
 * Upload buffer to Cloudinary (for multer memory storage)
 * @param {Object} file - Multer file object with buffer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result with url and public_id
 */
const uploadToCloudinary = (file, folder = "rental-home-listings") => {
  return new Promise((resolve, reject) => {
    console.log("📤 [Cloudinary] Uploading file to folder:", folder);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 1200, height: 800, crop: "limit", quality: "auto:good" }
        ],
        public_id: `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      },
      (error, result) => {
        if (error) {
          console.error("❌ [Cloudinary] Upload error:", error);
          reject(error);
        } else {
          console.log("✅ [Cloudinary] Upload successful:", result.secure_url);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );

    // Write buffer to stream
    uploadStream.end(file.buffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadUserProfile,
  uploadToCloudinary,
  deleteCloudinaryImage,
  extractPublicId,
  getOptimizedImageUrl,
  storage,
};
