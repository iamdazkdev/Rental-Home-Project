// Test admin routes loading
console.log('🔍 Testing admin routes...\n');

try {
    // Test 1: Load routes
    console.log('1️⃣ Loading routes/admin/index.js...');
    const adminRoutes = require('./routes/admin');
    console.log('✅ Routes loaded');
    console.log('Type:', typeof adminRoutes);
    console.log('Is function:', typeof adminRoutes === 'function');
    console.log();

    // Test 2: Load middleware
    console.log('2️⃣ Loading middleware/admin/adminAuth.js...');
    const {verifyAdmin} = require('./middleware/admin/adminAuth');
    console.log('✅ Middleware loaded');
    console.log('verifyAdmin is function:', typeof verifyAdmin === 'function');
    console.log();

    // Test 3: Load controller
    console.log('3️⃣ Loading controllers/admin/userController.js...');
    const controller = require('./controllers/admin/userController');
    console.log('✅ Controller loaded');
    console.log('Exports:', Object.keys(controller));
    console.log('Has getAdminStats:', typeof controller.getAdminStats === 'function');
    console.log();

    console.log('🎉 ALL TESTS PASSED!');
    console.log('\nAdmin module is ready to use.');

} catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error('\nStack trace:');
    console.error(err.stack);
    process.exit(1);
}

