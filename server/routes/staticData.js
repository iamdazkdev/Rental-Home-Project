const router = require('express').Router();
const Category = require('../models/Category');
const PropertyType = require('../models/PropertyType');
const Facility = require('../models/Facility');

/**
 * Get all active categories
 * GET /static-data/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

/**
 * Get all active property types
 * GET /static-data/types
 */
router.get('/types', async (req, res) => {
  try {
    const types = await PropertyType.find({ isActive: true }).sort({ order: 1 });
    res.json(types);
  } catch (error) {
    console.error('Error fetching property types:', error);
    res.status(500).json({ message: 'Failed to fetch property types', error: error.message });
  }
});

/**
 * Get all active facilities
 * GET /static-data/facilities
 */
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort({ order: 1 });
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Failed to fetch facilities', error: error.message });
  }
});

/**
 * Get all static data at once
 * GET /static-data/all
 */
router.get('/all', async (req, res) => {
  try {
    const [categories, types, facilities] = await Promise.all([
      Category.find({ isActive: true }).sort({ order: 1 }),
      PropertyType.find({ isActive: true }).sort({ order: 1 }),
      Facility.find({ isActive: true }).sort({ order: 1 })
    ]);

    res.json({
      categories,
      types,
      facilities
    });
  } catch (error) {
    console.error('Error fetching static data:', error);
    res.status(500).json({ message: 'Failed to fetch static data', error: error.message });
  }
});

module.exports = router;

