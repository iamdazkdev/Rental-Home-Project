#!/bin/bash

# Quick Demo - Add to Wishlist Feature
# This script helps you quickly test the wishlist functionality

echo "🎯 WISHLIST FEATURE - QUICK DEMO"
echo "=================================="
echo ""

# Check servers
echo "📡 Checking servers..."
if lsof -i :5000 >/dev/null 2>&1; then
  echo "   ✅ Server is running (port 5000)"
else
  echo "   ❌ Server NOT running - please start it first!"
  echo "      cd server && npm start"
  exit 1
fi

if lsof -i :3000 >/dev/null 2>&1; then
  echo "   ✅ Client is running (port 3000)"
else
  echo "   ❌ Client NOT running - please start it first!"
  echo "      cd client && npm start"
  exit 1
fi

echo ""
echo "🎉 Everything is ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 HOW TO ADD TO WISHLIST:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Step 1: Open your browser"
echo "   → http://localhost:3000"
echo ""
echo "Step 2: Login"
echo "   → Click 'Login' (top right)"
echo "   → Enter credentials"
echo ""
echo "Step 3: Find a listing you like"
echo "   → Browse home page"
echo "   → Look at the listing cards"
echo ""
echo "Step 4: Click the heart icon ❤️"
echo "   → Icon is in top-right corner of each card"
echo "   → Click once to add (heart turns RED)"
echo "   → Click again to remove (heart turns WHITE)"
echo ""
echo "Step 5: View your wishlist"
echo "   → Click your avatar (top right)"
echo "   → Select 'Wish List' from menu"
echo "   → See all your saved listings!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VISUAL GUIDE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Listing Card:"
echo "  ┌─────────────────────┐"
echo "  │  [Photo]       ❤️   │ ← Click this heart!"
echo "  │                     │"
echo "  │  Beach House        │"
echo "  │  Danang, Vietnam    │"
echo "  │  \$100/night         │"
echo "  └─────────────────────┘"
echo ""
echo "  Heart States:"
echo "  ❤️  RED   = In wishlist"
echo "  ♡  WHITE = Not in wishlist"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 TIPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✓ You MUST be logged in"
echo "  ✓ Cannot add your own listings"
echo "  ✓ Toggle on/off by clicking heart"
echo "  ✓ Check console logs (F12) for debug info"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐛 TROUBLESHOOTING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Problem: Heart doesn't change color"
echo "  → Make sure you're logged in"
echo "  → Check browser console (F12) for errors"
echo "  → Check Network tab for failed requests"
echo ""
echo "  Problem: Can't click heart"
echo "  → Login first"
echo "  → Try a different listing (not yours)"
echo ""
echo "  Problem: Wishlist page is empty"
echo "  → Add some listings first"
echo "  → Refresh the page"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 MORE INFO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Full guide: HOW_TO_USE_WISHLIST.md"
echo "  Vietnamese: docs/WISHLIST_FEATURE_FIXED_VI.md"
echo "  English: docs/WISHLIST_FIX.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Ready to test! Open http://localhost:3000 in your browser!"
echo ""

# Optional: Open browser automatically (macOS)
read -p "Open browser automatically? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  open "http://localhost:3000"
  echo "✅ Browser opened!"
fi

