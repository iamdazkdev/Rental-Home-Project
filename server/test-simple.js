const express = require("express");
const app = express();

console.log("🔍 Simple Router Test\n");

// Create a simple test router
const testRouter = express.Router();

testRouter.get("/test", (req, res) => {
    console.log("✅ Test route handler called!");
    res.json({
        success: true,
        message: "Test route works!"
    });
});

// Mount at /admin
app.use("/admin", testRouter);

console.log("1️⃣ Simple router created and mounted at /admin");
console.log("2️⃣ Starting server on port 8888...\n");

const server = app.listen(8888, () => {
    console.log("✅ Server running");
    console.log("\nTest manually:");
    console.log("   curl http://localhost:8888/admin/test\n");

    // Auto test after 1 second
    setTimeout(() => {
        const http = require("http");
        http.get('http://localhost:8888/admin/test', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log("📥 Response:", data);
                if (data.includes("Test route works")) {
                    console.log("\n🎉 Simple router WORKS!");
                    console.log("\nNow testing actual admin router...\n");

                    // Test actual admin router
                    const adminRoutes = require("./routes/admin");
                    const app2 = express();
                    app2.use("/admin", adminRoutes);

                    const server2 = app2.listen(7777, () => {
                        console.log("✅ Admin router server on port 7777");

                        http.get('http://localhost:7777/admin/test', (res2) => {
                            let data2 = '';
                            res2.on('data', chunk => data2 += chunk);
                            res2.on('end', () => {
                                console.log("\n📥 Admin router response:", data2);

                                if (data2.includes("Admin routes are working")) {
                                    console.log("\n🎉🎉🎉 ADMIN ROUTER WORKS PERFECTLY!");
                                    console.log("\n✅ Admin routes CAN be loaded!");
                                    console.log("✅ The problem is with your MAIN server!");
                                    console.log("\n💡 Solution:");
                                    console.log("   1. Kill ALL node: pkill -9 node");
                                    console.log("   2. Start server: npm start");
                                    console.log("   3. Must see: '✅ Admin routes loaded successfully'");
                                } else {
                                    console.log("\n❌ Admin router returned unexpected response");
                                    console.log("Check routes/admin/index.js");
                                }

                                server2.close();
                                server.close();
                                process.exit(0);
                            });
                        }).on('error', (e) => {
                            console.error("❌ Error:", e.message);
                            server2.close();
                            server.close();
                            process.exit(1);
                        });
                    });
                } else {
                    console.log("❌ Simple router failed!");
                    server.close();
                    process.exit(1);
                }
            });
        }).on('error', (e) => {
            console.error("❌ Error:", e.message);
            server.close();
            process.exit(1);
        });
    }, 1000);
});

