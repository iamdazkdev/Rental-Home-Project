/**
 * Quick script to verify admin account exists
 * Run: node server/scripts/verifyAdmin.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function verifyAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('🔌 Connected to MongoDB\n');

    const admin = await User.findOne({ email: 'admin@gmail.com' });

    if (admin) {
      console.log('✅ Admin account found!\n');
      console.log('📋 Account Details:');
      console.log('   ID:', admin._id);
      console.log('   Email:', admin.email);
      console.log('   Name:', `${admin.firstName} ${admin.lastName}`);
      console.log('   Role:', admin.role);
      console.log('   Created:', admin.createdAt);
      console.log('\n🎉 Account is ready to use!');
    } else {
      console.log('❌ Admin account not found!');
      console.log('ℹ️  Run: node scripts/createAdminAccount.js');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAdmin();

