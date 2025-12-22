#!/bin/bash

# Wishlist Feature - Final Verification Script
# Run this to verify all changes are in place

echo "🔍 Verifying Wishlist Feature Implementation..."
echo ""

cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project"

# Check if server is running
echo "1️⃣ Checking server status..."
if lsof -i :5000 >/dev/null 2>&1; then
  echo "   ✅ Server is running on port 5000"
else
  echo "   ❌ Server is NOT running - please start it"
fi
echo ""

# Check client files exist
echo "2️⃣ Checking client files..."
files=(
  "client/src/components/ListingCard.jsx"
  "client/src/pages/listing/WishList.jsx"
  "client/src/App.js"
  "client/src/components/Navbar.jsx"
  "client/src/styles/List.scss"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file exists"
  else
    echo "   ❌ $file is missing!"
  fi
done
echo ""

# Check server route
echo "3️⃣ Checking server route..."
if [ -f "server/routes/user.js" ]; then
  if grep -q "router.patch.*userId.*listingId" server/routes/user.js; then
    echo "   ✅ Wishlist PATCH route exists"
  else
    echo "   ❌ Wishlist PATCH route is missing!"
  fi
else
  echo "   ❌ server/routes/user.js not found!"
fi
echo ""

# Check for key code patterns
echo "4️⃣ Checking code implementations..."

# Check ListingCard has fixed logic
if grep -q "const itemId = item?._id || item?.id || item" client/src/components/ListingCard.jsx; then
  echo "   ✅ ListingCard has fixed isLiked logic"
else
  echo "   ⚠️  ListingCard might still have old logic"
fi

# Check WishList component exists
if [ -f "client/src/pages/listing/WishList.jsx" ]; then
  if grep -q "getWishListDetails" client/src/pages/listing/WishList.jsx; then
    echo "   ✅ WishList page has fetch logic"
  else
    echo "   ⚠️  WishList page might be incomplete"
  fi
fi

# Check App.js has route
if grep -q "/:userId/wishlist" client/src/App.js; then
  echo "   ✅ App.js has wishlist route"
else
  echo "   ❌ App.js is missing wishlist route!"
fi

# Check Navbar has correct links
if grep -q '/${user._id || user.id}/wishlist' client/src/components/Navbar.jsx; then
  echo "   ✅ Navbar has correct wishlist link"
else
  echo "   ⚠️  Navbar might have incorrect link"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If all checks pass ✅, the wishlist feature is ready!"
echo ""
echo "Next steps:"
echo "1. Make sure server is running (npm start in server/)"
echo "2. Make sure client is running (npm start in client/)"
echo "3. Login to the app"
echo "4. Test adding/removing from wishlist"
echo "5. Check the Wish List page from menu"
echo ""
echo "For detailed documentation, see:"
echo "  - docs/WISHLIST_FEATURE_FIXED_VI.md (Vietnamese)"
echo "  - docs/WISHLIST_FIX.md (English)"
echo ""

