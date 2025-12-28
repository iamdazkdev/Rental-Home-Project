/**
 * Upgrade existing user to admin role
 * Run: node server/scripts/upgradeToAdmin.js
 *
 * Usage:
 * 1. Register account normally via UI
 * 2. Run this script with the email
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function upgradeToAdmin() {
  try {
    console.log('🔐 Upgrade User to Admin\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Ask for email
    const email = await askQuestion('📧 Enter user email to upgrade: ');

    if (!email) {
      console.log('❌ Email is required!');
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n📋 User Found:');
    console.log('   Name:', `${user.firstName} ${user.lastName}`);
    console.log('   Email:', user.email);
    console.log('   Current Role:', user.role);

    // Confirm
    const confirm = await askQuestion('\n⚠️  Upgrade this user to ADMIN? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled.');
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update role
    user.role = 'admin';
    await user.save();

    console.log('\n✅ User upgraded to ADMIN successfully!\n');
    console.log('📋 Updated Account:');
    console.log('   Name:', `${user.firstName} ${user.lastName}`);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('\n🔗 Access Admin Dashboard:');
    console.log('   Login at: http://localhost:3000/login');
    console.log('   Then go to: http://localhost:3000/admin/dashboard\n');

    rl.close();
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run
upgradeToAdmin();

