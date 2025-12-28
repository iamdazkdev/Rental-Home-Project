const mongoose = require("mongoose");
const Booking = require("../models/Booking");
require("dotenv").config();

/**
 * Migration script to convert old 'status' field to new 'bookingStatus' field
 * This ensures backward compatibility for existing data in the database
 */

const migrateBookingStatus = async () => {
  try {
    console.log("🔄 Starting booking status migration...");

    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Status mapping from old values to new values
    const statusMapping = {
      'pending': 'pending',
      'accepted': 'approved',
      'approved': 'approved',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'checked_in': 'checked_in',
      'checked_out': 'checked_out',
      'completed': 'completed',
      'expired': 'expired',
    };

    // Find all bookings that have 'status' field but no 'bookingStatus' field
    const bookingsToMigrate = await Booking.find({
      $or: [
        { bookingStatus: { $exists: false } },
        { bookingStatus: null },
        { bookingStatus: '' }
      ]
    });

    console.log(`📋 Found ${bookingsToMigrate.length} bookings to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const booking of bookingsToMigrate) {
      try {
        const oldStatus = booking.status;
        const newStatus = statusMapping[oldStatus] || 'pending';

        booking.bookingStatus = newStatus;

        // Remove old status field if exists
        if (booking.status) {
          booking.status = undefined;
        }

        await booking.save();
        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(`✅ Migrated ${migratedCount} bookings...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating booking ${booking._id}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${bookingsToMigrate.length}`);

    await mongoose.connection.close();
    console.log("\n✅ Migration completed and database connection closed");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateBookingStatus()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrateBookingStatus;

