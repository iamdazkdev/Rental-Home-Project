#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Dream Nest Server - Email Fix & Restart"
echo "=========================================="

cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"

# Step 1: Kill existing processes
echo -e "\n${YELLOW}Step 1: Stopping existing server...${NC}"
pkill -f "node.*index.js" 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Server stopped${NC}"

# Step 2: Verify nodemailer installation
echo -e "\n${YELLOW}Step 2: Checking nodemailer installation...${NC}"
if [ ! -d "node_modules/nodemailer" ]; then
  echo -e "${RED}✗ nodemailer not found, installing...${NC}"
  npm install nodemailer@latest --save
else
  echo -e "${GREEN}✓ nodemailer is installed${NC}"
fi

# Step 3: Test email service
echo -e "\n${YELLOW}Step 3: Testing email service...${NC}"
node test-email.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Email service test passed${NC}"
else
  echo -e "${RED}✗ Email service test failed${NC}"
  exit 1
fi

# Step 4: Start server
echo -e "\n${YELLOW}Step 4: Starting server...${NC}"
echo -e "${GREEN}Server is starting on port 5000...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
NODE_ENV=development node index.js

