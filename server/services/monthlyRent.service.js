const cron = require("node-cron");
const axios = require("axios");

/**
 * Automatically generate monthly rent on 1st of each month
 * Runs at 00:05 AM on the 1st day of every month
 */
const startMonthlyRentScheduler = () => {
  // Run at 00:05 AM on day 1 of every month
  cron.schedule("5 0 1 * *", async () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    console.log(`\n🔄 [Monthly Rent Scheduler] Running on ${now.toISOString()}`);
    console.log(`📅 Generating monthly rent for ${year}-${month}`);

    try {
      const response = await axios.post("http://localhost:3001/room-rental-advanced/monthly-rent/generate", {
        month,
        year,
      });

      if (response.data.success) {
        console.log(`✅ Generated ${response.data.count} monthly rent records`);
      } else {
        console.error("❌ Failed to generate monthly rent:", response.data.message);
      }
    } catch (error) {
      console.error("❌ Error in monthly rent scheduler:", error.message);
    }
  });

  console.log("✅ Monthly Rent Scheduler started (runs at 00:05 on 1st of each month)");
};

module.exports = { startMonthlyRentScheduler };

