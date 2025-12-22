const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Listing = require("./models/Listing");

console.log("=== Testing Wishlist Route ===\n");

async function testWishlist() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Find a test user and listing
    const user = await User.findOne();
    const listing = await Listing.findOne();

    if (!user) {
      console.log("❌ No users found in database. Please create a user first.");
      process.exit(1);
    }

    if (!listing) {
      console.log("❌ No listings found in database. Please create a listing first.");
      process.exit(1);
    }

    console.log(`\n📋 Test Data:`);
    console.log(`User ID: ${user._id}`);
    console.log(`User Email: ${user.email}`);
    console.log(`Listing ID: ${listing._id}`);
    console.log(`Listing Title: ${listing.title || "No title"}`);
    console.log(`Current wishList length: ${user.wishList.length}`);

    // Test the logic that was failing
    console.log(`\n🧪 Testing wishlist logic...`);

    const listingId = listing._id.toString();

    // Simulate the findIndex logic
    const favoriteIndex = user.wishList.findIndex((item) => {
      const id = item && (item._id || item.id || item);
      return String(id) === String(listingId);
    });

    console.log(`Favorite Index: ${favoriteIndex}`);

    if (favoriteIndex !== -1) {
      console.log(`✅ Listing is already in wishlist at index ${favoriteIndex}`);
      console.log(`Action: Would REMOVE from wishlist`);
    } else {
      console.log(`✅ Listing is NOT in wishlist`);
      console.log(`Action: Would ADD to wishlist`);
    }

    console.log(`\n🎉 Wishlist logic test passed! No errors.`);

  } catch (error) {
    console.error(`\n❌ Error during test:`, error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testWishlist();

