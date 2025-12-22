#!/bin/bash

echo "🔄 Restarting server with fresh configuration..."
cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"

# Kill any existing Node processes on port 5000
echo "Stopping existing server..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 1

# Clear node modules cache (optional, only if needed)
# rm -rf node_modules package-lock.json
# npm install

echo "✅ Starting server..."
NODE_ENV=development node index.js

