#!/bin/bash

# Vercel CLI Quick Deploy Script
# Run: ./vercel-deploy.sh

echo "🚀 Starting Vercel Deployment..."
echo ""

# Navigate to client directory
cd "/Users/iamdazkdev/Data/SourceCode/Visual Studio Code/Rental Home Project/client"

echo "📁 Current directory: $(pwd)"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Deploy to production
echo "🔨 Building and deploying to production..."
echo ""

vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be live at: https://your-app.vercel.app"
echo ""
echo "📊 View deployments: https://vercel.com/dashboard"

