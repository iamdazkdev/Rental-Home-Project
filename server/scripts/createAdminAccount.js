/**
 * Script to create admin account
 * Run: node server/scripts/createAdminAccount.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const ADMIN_ACCOUNT = {
  email: 'admin@gmail.com',
  password: 'Admin@230500',
  firstName: 'Admin',
  lastName: 'System',
  role: 'admin'
};

async function createAdminAccount() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_ACCOUNT.email });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Role:', existingAdmin.role);

      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role\n');
      } else {
        console.log('ℹ️  Already has admin role\n');
      }

      console.log('✅ Admin account ready:');
      console.log('   Email:', ADMIN_ACCOUNT.email);
      console.log('   Password: [HIDDEN]');
      console.log('   Access: http://localhost:3000/admin/dashboard\n');

      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_ACCOUNT.password, salt);

    // Create admin user
    console.log('👤 Creating admin account...');
    const adminUser = new User({
      email: ADMIN_ACCOUNT.email,
      password: hashedPassword,
      firstName: ADMIN_ACCOUNT.firstName,
      lastName: ADMIN_ACCOUNT.lastName,
      role: ADMIN_ACCOUNT.role,
      profileImagePath: '',
      hostBio: 'System Administrator',
      tripList: [],
      wishList: [],
      propertyList: [],
      reservationList: [],
    });

    await adminUser.save();

    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   Email:', ADMIN_ACCOUNT.email);
    console.log('   Password:', ADMIN_ACCOUNT.password);
    console.log('   Role:', ADMIN_ACCOUNT.role);
    console.log('   Name:', `${ADMIN_ACCOUNT.firstName} ${ADMIN_ACCOUNT.lastName}`);
    console.log('\n🔗 Access Admin Dashboard:');
    console.log('   1. Login at: http://localhost:3000/login');
    console.log('   2. Navigate to: http://localhost:3000/admin/dashboard');
    console.log('   3. Or click avatar → "🔐 Admin Dashboard"\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Done! MongoDB disconnected.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
}

// Run
console.log('🚀 Starting admin account creation...\n');
createAdminAccount();

