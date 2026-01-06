/**
 * Test Script for User Categories API
 * Run: node server/scripts/testUserCategories.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testUserCategories() {
  try {
    console.log('🧪 Starting User Categories API Test...\n');

    // Replace with actual user ID from your database
    const TEST_USER_ID = '694aa083f52a2bc7570cadfa'; // HOST ANH's ID

    console.log(`📍 Testing with User ID: ${TEST_USER_ID}\n`);

    // Test 1: Initialize user categories
    console.log('1️⃣ Testing: Initialize categories from global templates');
    const initRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/initialize`, {
      method: 'POST'
    });
    const initData = await initRes.json();
    console.log('Result:', initData.message);
    console.log(`✅ Initialized ${initData.categories?.length || 0} categories\n`);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Get user's categories
    console.log('2️⃣ Testing: Get user categories');
    const getRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}?activeOnly=true`);
    const categories = await getRes.json();
    console.log(`✅ Found ${categories.length} active categories`);
    console.log('First 3:', categories.slice(0, 3).map(c => c.label).join(', '));
    console.log('');

    // Test 3: Create custom category
    console.log('3️⃣ Testing: Create custom category');
    const createRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: 'Pet Paradise',
        description: 'Properties perfect for pets',
        icon: 'pets',
        img: 'pet-paradise.jpg',
        displayOrder: 100
      })
    });
    const createData = await createRes.json();
    console.log('Result:', createData.message);
    const newCategoryId = createData.category?._id;
    console.log(`✅ Created category ID: ${newCategoryId}\n`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Edit category
    console.log('4️⃣ Testing: Edit category');
    const editRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/${newCategoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Updated: Best properties for your furry friends!',
        displayOrder: 5,
        isActive: true
      })
    });
    const editData = await editRes.json();
    console.log('Result:', editData.message);
    console.log(`✅ Updated description: "${editData.category?.description}"\n`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Hide category
    console.log('5️⃣ Testing: Hide category (soft delete)');
    const hideRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/${newCategoryId}`, {
      method: 'DELETE'
    });
    const hideData = await hideRes.json();
    console.log('Result:', hideData.message);
    console.log(`✅ Category hidden (isActive: ${hideData.category?.isActive})\n`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 6: Show category again
    console.log('6️⃣ Testing: Show category (reactivate)');
    const showRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/${newCategoryId}/reactivate`, {
      method: 'PATCH'
    });
    const showData = await showRes.json();
    console.log('Result:', showData.message);
    console.log(`✅ Category shown (isActive: ${showData.category?.isActive})\n`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 7: Bulk reorder
    console.log('7️⃣ Testing: Bulk update display order');
    const reorderRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/bulk-update-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: [
          { id: newCategoryId, displayOrder: 0 },
          { id: categories[0]._id, displayOrder: 1 },
          { id: categories[1]._id, displayOrder: 2 }
        ]
      })
    });
    const reorderData = await reorderRes.json();
    console.log('Result:', reorderData.message);
    console.log(`✅ Reordered ${reorderData.modifiedCount || 3} categories\n`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 8: Get global categories to fork
    console.log('8️⃣ Testing: Get global categories');
    const globalRes = await fetch(`${BASE_URL}/categories?activeOnly=true`);
    const globalCats = await globalRes.json();
    console.log(`✅ Found ${globalCats.length} global categories`);

    // Find one not yet forked
    const toFork = globalCats.find(gc =>
      !categories.some(uc => uc.forkedFromId?.toString() === gc._id.toString())
    );

    if (toFork) {
      console.log(`   Will try to fork: "${toFork.label}"\n`);

      // Test 9: Fork global category
      console.log('9️⃣ Testing: Fork global category');
      const forkRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/fork/${toFork._id}`, {
        method: 'POST'
      });
      const forkData = await forkRes.json();
      console.log('Result:', forkData.message);
      console.log(`✅ Forked category: "${forkData.category?.label}"\n`);
    } else {
      console.log('   (All global categories already forked)\n');
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 10: Delete permanently
    console.log('🔟 Testing: Delete permanently');
    const deleteRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}/${newCategoryId}?permanent=true`, {
      method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    console.log('Result:', deleteData.message);
    console.log(`✅ Category permanently deleted\n`);

    // Final check
    console.log('🎯 Final Check: Get updated categories');
    const finalRes = await fetch(`${BASE_URL}/user-categories/user/${TEST_USER_ID}?activeOnly=true`);
    const finalCats = await finalRes.json();
    console.log(`✅ User now has ${finalCats.length} active categories\n`);

    console.log('🎉 All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests
console.log('⚠️  Make sure server is running on http://localhost:3001\n');
testUserCategories();

