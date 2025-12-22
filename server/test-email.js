const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("=== Nodemailer Test ===");
console.log("Node version:", process.version);

// Check if nodemailer has the right method
console.log("\nChecking nodemailer object:");
console.log("- createTransport:", typeof nodemailer.createTransport);
console.log("- createTransporter:", typeof nodemailer.createTransporter);

if (typeof nodemailer.createTransport !== "function") {
  console.error("\n❌ ERROR: nodemailer.createTransport is not a function!");
  console.log("This means nodemailer is not properly installed or loaded.");
  process.exit(1);
}

// Test creating a transporter
console.log("\n=== Testing transporter creation ===");
try {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  console.log("✅ Successfully created Gmail transporter");

  // Test verification
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Transporter verification failed:", error.message);
    } else {
      console.log("✅ Transporter verified - ready to send emails");
    }
  });
} catch (error) {
  console.error("❌ Error creating transporter:", error.message);
  process.exit(1);
}

// Test the emailService module
console.log("\n=== Testing emailService module ===");
try {
  const { createTransporter, sendPasswordResetEmail } = require("./services/emailService");
  console.log("✅ emailService module imported successfully");

  const transporter = createTransporter();
  console.log("✅ Successfully created transporter from emailService");
  console.log("\n🎉 All tests passed! Email service is ready.");
} catch (error) {
  console.error("❌ Error with emailService:");
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

