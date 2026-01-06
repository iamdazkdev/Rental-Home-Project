/**
 * Migration Script to Upload Static Data to MongoDB
 * Run this once to populate categories, types, and facilities collections
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

// Import models
const Category = require('../models/Category');
const PropertyType = require('../models/PropertyType');
const Facility = require('../models/Facility');

// Static data from client/src/data.js
const categoriesData = [
  {
    label: "All",
    icon: "BiWorld",
  },
  {
    img: "assets/beach_cat.jpg",
    label: "Beachfront",
    icon: "TbBeach",
    description: "This property is close to the beach!",
  },
  {
    img: "assets/windmill_cat.webp",
    label: "Windmills",
    icon: "GiWindmill",
    description: "This property is has windmills!",
  },
  {
    img: "assets/modern_cat.webp",
    label: "Iconic cities",
    icon: "MdOutlineVilla",
    description: "This property is modern!",
  },
  {
    img: "assets/countryside_cat.webp",
    label: "Countryside",
    icon: "TbMountain",
    description: "This property is in the countryside!",
  },
  {
    img: "assets/pool_cat.jpg",
    label: "Amazing Pools",
    icon: "TbPool",
    description: "This is property has a beautiful pool!",
  },
  {
    img: "assets/island_cat.webp",
    label: "Islands",
    icon: "GiIsland",
    description: "This property is on an island!",
  },
  {
    img: "assets/lake_cat.webp",
    label: "Lakefront",
    icon: "GiBoatFishing",
    description: "This property is near a lake!",
  },
  {
    img: "assets/skiing_cat.jpg",
    label: "Ski-in/out",
    icon: "FaSkiing",
    description: "This property has skiing activies!",
  },
  {
    img: "assets/castle_cat.webp",
    label: "Castles",
    icon: "GiCastle",
    description: "This property is an ancient castle!",
  },
  {
    img: "assets/cave_cat.jpg",
    label: "Caves",
    icon: "GiCaveEntrance",
    description: "This property is in a spooky cave!",
  },
  {
    img: "assets/camping_cat.jpg",
    label: "Camping",
    icon: "GiForestCamp",
    description: "This property offers camping activities!",
  },
  {
    img: "assets/arctic_cat.webp",
    label: "Arctic",
    icon: "BsSnow",
    description: "This property is in arctic environment!",
  },
  {
    img: "assets/desert_cat.webp",
    label: "Desert",
    icon: "GiCactus",
    description: "This property is in the desert!",
  },
  {
    img: "assets/barn_cat.jpg",
    label: "Barns",
    icon: "GiBarn",
    description: "This property is in a barn!",
  },
  {
    img: "assets/lux_cat.jpg",
    label: "Luxury",
    icon: "IoDiamond",
    description: "This property is brand new and luxurious!",
  },
];

const typesData = [
  {
    name: "An entire place",
    description: "Guests have the whole place to themselves",
    icon: "FaHouseUser",
  },
  {
    name: "Room(s)",
    description: "Guests have their own room in a house, plus access to shared places",
    icon: "BsFillDoorOpenFill",
  },
  {
    name: "A Shared Room",
    description: "Guests sleep in a room or common area that maybe shared with you or others",
    icon: "FaPeopleRoof",
  },
];

const facilitiesData = [
  { name: "Bath tub", icon: "PiBathtubFill" },
  { name: "Personal care products", icon: "FaPumpSoap" },
  { name: "Outdoor shower", icon: "FaShower" },
  { name: "Washer", icon: "BiSolidWasher" },
  { name: "Dryer", icon: "BiSolidDryer" },
  { name: "Hangers", icon: "PiCoatHangerFill" },
  { name: "Iron", icon: "TbIroning3" },
  { name: "TV", icon: "PiTelevisionFill" },
  { name: "Dedicated workspace", icon: "BsPersonWorkspace" },
  { name: "Air Conditioning", icon: "BsSnow" },
  { name: "Heating", icon: "GiHeatHaze" },
  { name: "Security cameras", icon: "GiCctvCamera" },
  { name: "Fire extinguisher", icon: "FaFireExtinguisher" },
  { name: "First Aid", icon: "BiSolidFirstAid" },
  { name: "Wifi", icon: "BiWifi" },
  { name: "Cooking set", icon: "FaKitchenSet" },
  { name: "Refrigerator", icon: "BiSolidFridge" },
  { name: "Microwave", icon: "MdMicrowave" },
  { name: "Stove", icon: "GiToaster" },
  { name: "Barbecue grill", icon: "GiBarbecue" },
  { name: "Outdoor dining area", icon: "FaUmbrellaBeach" },
  { name: "Private patio or Balcony", icon: "MdBalcony" },
  { name: "Camp fire", icon: "GiCampfire" },
  { name: "Garden", icon: "MdYard" },
  { name: "Free parking", icon: "AiFillCar" },
  { name: "Self check-in", icon: "FaKey" },
  { name: "Pet allowed", icon: "MdPets" },
];

async function migrateData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Category.deleteMany({});
    await PropertyType.deleteMany({});
    await Facility.deleteMany({});
    console.log('✅ Existing data cleared');

    // Insert categories
    console.log('📦 Inserting categories...');
    const categories = await Category.insertMany(
      categoriesData.map((cat, index) => ({
        ...cat,
        order: index,
        isActive: true
      }))
    );
    console.log(`✅ Inserted ${categories.length} categories`);

    // Insert property types
    console.log('📦 Inserting property types...');
    const types = await PropertyType.insertMany(
      typesData.map((type, index) => ({
        ...type,
        order: index,
        isActive: true
      }))
    );
    console.log(`✅ Inserted ${types.length} property types`);

    // Insert facilities
    console.log('📦 Inserting facilities...');
    const facilities = await Facility.insertMany(
      facilitiesData.map((facility, index) => ({
        ...facility,
        order: index,
        isActive: true
      }))
    );
    console.log(`✅ Inserted ${facilities.length} facilities`);

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Property Types: ${types.length}`);
    console.log(`  - Facilities: ${facilities.length}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();

