const express = require("express");
const app = express();

console.log("🔍 Testing Admin Routes Loading...\n");

try {
    console.log("1️⃣ Loading admin routes module...");
    const adminRoutes = require("./routes/admin");
    console.log("✅ Module loaded successfully");
    console.log("   Type:", typeof adminRoutes);

    console.log("\n2️⃣ Registering routes...");
    app.use("/admin", adminRoutes);
    console.log("✅ Routes registered at /admin");

    console.log("\n3️⃣ Listing registered routes...");
    console.log("   Expected: /admin/test, /admin/stats, /admin/users");

    console.log("\n4️⃣ Starting test server on port 9999...");
    const server = app.listen(9999, () => {
        console.log("✅ Test server running on port 9999");
        console.log("\n5️⃣ Testing route /admin/test...");

        const http = require("http");
        const options = {
            hostname: 'localhost',
            port: 9999,
            path: '/admin/test',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log("\n📥 Response:", data);
                if (data.includes("Admin routes are working")) {
                    console.log("\n🎉 SUCCESS! Admin routes work perfectly!");
                    console.log("\n✅ The issue is NOT with admin files.");
                    console.log("✅ The issue is with your main server not loading them.");
                    console.log("\n💡 Solution:");
                    console.log("   1. Make sure you killed ALL node processes");
                    console.log("   2. Start server from correct folder");
                    console.log("   3. Wait for 'Admin routes loaded successfully' message");
                } else {
                    console.log("\n❌ Unexpected response");
                }
                server.close();
                process.exit(0);
            });
        });

        req.on('error', (e) => {
            console.error("\n❌ Request failed:", e.message);
            server.close();
            process.exit(1);
        });

        req.end();
    });

} catch (error) {
    console.error("\n❌ FAILED!");
    console.error("Error:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
}

