/**
 * Background Job Service for Booking Lock Cleanup
 *
 * Periodically checks and releases expired booking intents
 * This ensures listings don't remain locked indefinitely
 */

const cron = require("node-cron");
const { releaseExpiredIntents } = require("./concurrentBookingService");

let cleanupJob = null;

/**
 * Start the expired lock cleanup job
 * Runs every minute to check for expired intents
 */
const startLockCleanupJob = () => {
  // Run every minute
  cleanupJob = cron.schedule("* * * * *", async () => {
    try {
      const releasedCount = await releaseExpiredIntents();
      if (releasedCount > 0) {
        console.log(`🔓 [Lock Cleanup Job] Released ${releasedCount} expired booking lock(s)`);
      }
    } catch (error) {
      console.error("❌ [Lock Cleanup Job] Error:", error.message);
    }
  });

  console.log("✅ [Lock Cleanup Job] Started - checking for expired locks every minute");
};

/**
 * Stop the cleanup job
 */
const stopLockCleanupJob = () => {
  if (cleanupJob) {
    cleanupJob.stop();
    console.log("🛑 [Lock Cleanup Job] Stopped");
  }
};

/**
 * Run cleanup immediately (for testing or manual triggers)
 */
const runCleanupNow = async () => {
  console.log("🔄 [Lock Cleanup Job] Running immediate cleanup...");
  const count = await releaseExpiredIntents();
  console.log(`✅ [Lock Cleanup Job] Immediate cleanup complete. Released ${count} lock(s)`);
  return count;
};

module.exports = {
  startLockCleanupJob,
  stopLockCleanupJob,
  runCleanupNow,
};

