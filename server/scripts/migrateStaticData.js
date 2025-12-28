/**
 * Migration Script: Migrate static data from data.js to MongoDB
 * Run this script once to populate initial data
 *
 * Usage: node scripts/migrateStaticData.js
 */

const mongoose = require("mongoose");
const Category = require("../models/Category");
const PropertyType = require("../models/PropertyType");
const Facility = require("../models/Facility");
require("dotenv").config();

// Icon name mappings (from React Icons to simple names)
const iconMap = {
  // Categories
  BiWorld: "world",
  TbBeach: "beach",
  GiWindmill: "windmill",
  MdOutlineVilla: "villa",
  TbMountain: "mountain",
  TbPool: "pool",
  GiIsland: "island",
  GiBoatFishing: "boat",
  FaSkiing: "skiing",
  GiCastle: "castle",
  GiCaveEntrance: "cave",
  GiForestCamp: "camping",
  BsSnow: "snow",
  GiCactus: "cactus",
  GiBarn: "barn",
  IoDiamond: "diamond",

  // Types
  FaHouseUser: "house-user",
  BsFillDoorOpenFill: "door",
  FaPeopleRoof: "people-roof",

  // Facilities
  PiBathtubFill: "bathtub",
  FaPumpSoap: "soap",
  FaShower: "shower",
  BiSolidWasher: "washer",
  BiSolidDryer: "dryer",
  PiCoatHangerFill: "hanger",
  TbIroning3: "iron",
  PiTelevisionFill: "tv",
  BsPersonWorkspace: "workspace",
  GiHeatHaze: "heating",
  GiCctvCamera: "camera",
  FaFireExtinguisher: "fire-extinguisher",
  BiSolidFirstAid: "first-aid",
  BiWifi: "wifi",
  FaKitchenSet: "kitchen",
  BiSolidFridge: "fridge",
  MdMicrowave: "microwave",
  GiToaster: "stove",
  GiBarbecue: "bbq",
  FaUmbrellaBeach: "umbrella",
  MdBalcony: "balcony",
  GiCampfire: "campfire",
  MdYard: "garden",
  AiFillCar: "car",
  FaKey: "key",
  MdPets: "pets",
};

// Static data from data.js
const categoriesData = [
  {
    label: "All",
    icon: "world",
    description: "",
    img: null,
    displayOrder: 0,
  },
  {
    label: "Beachfront",
    icon: "beach",
    description: "This property is close to the beach!",
    img: "assets/beach_cat.jpg",
    displayOrder: 1,
  },
  {
    label: "Windmills",
    icon: "windmill",
    description: "This property is has windmills!",
    img: "assets/windmill_cat.webp",
    displayOrder: 2,
  },
  {
    label: "Iconic cities",
    icon: "villa",
    description: "This property is modern!",
    img: "assets/modern_cat.webp",
    displayOrder: 3,
  },
  {
    label: "Countryside",
    icon: "mountain",
    description: "This property is in the countryside!",
    img: "assets/countryside_cat.webp",
    displayOrder: 4,
  },
  {
    label: "Amazing Pools",
    icon: "pool",
    description: "This is property has a beautiful pool!",
    img: "assets/pool_cat.jpg",
    displayOrder: 5,
  },
  {
    label: "Islands",
    icon: "island",
    description: "This property is on an island!",
    img: "assets/island_cat.webp",
    displayOrder: 6,
  },
  {
    label: "Lakefront",
    icon: "boat",
    description: "This property is near a lake!",
    img: "assets/lake_cat.webp",
    displayOrder: 7,
  },
  {
    label: "Ski-in/out",
    icon: "skiing",
    description: "This property has skiing activies!",
    img: "assets/skiing_cat.jpg",
    displayOrder: 8,
  },
  {
    label: "Castles",
    icon: "castle",
    description: "This property is an ancient castle!",
    img: "assets/castle_cat.webp",
    displayOrder: 9,
  },
  {
    label: "Caves",
    icon: "cave",
    description: "This property is in a spooky cave!",
    img: "assets/cave_cat.jpg",
    displayOrder: 10,
  },
  {
    label: "Camping",
    icon: "camping",
    description: "This property offers camping activities!",
    img: "assets/camping_cat.jpg",
    displayOrder: 11,
  },
  {
    label: "Arctic",
    icon: "snow",
    description: "This property is in arctic environment!",
    img: "assets/arctic_cat.webp",
    displayOrder: 12,
  },
  {
    label: "Desert",
    icon: "cactus",
    description: "This property is in the desert!",
    img: "assets/desert_cat.webp",
    displayOrder: 13,
  },
  {
    label: "Barns",
    icon: "barn",
    description: "This property is in a barn!",
    img: "assets/barn_cat.jpg",
    displayOrder: 14,
  },
  {
    label: "Luxury",
    icon: "diamond",
    description: "This property is brand new and luxurious!",
    img: "assets/lux_cat.jpg",
    displayOrder: 15,
  },
];

const typesData = [
  {
    name: "An entire place",
    description: "Guests have the whole place to themselves",
    icon: "house-user",
    displayOrder: 0,
  },
  {
    name: "Room(s)",
    description: "Guests have their own room in a house, plus access to shared places",
    icon: "door",
    displayOrder: 1,
  },
  {
    name: "A Shared Room",
    description: "Guests sleep in a room or common area that maybe shared with you or others",
    icon: "people-roof",
    displayOrder: 2,
  },
];

const facilitiesData = [
  // Bathroom
  { name: "Bath tub", icon: "bathtub", category: "bathroom", displayOrder: 0 },
  { name: "Personal care products", icon: "soap", category: "bathroom", displayOrder: 1 },
  { name: "Outdoor shower", icon: "shower", category: "bathroom", displayOrder: 2 },

  // Basic
  { name: "Washer", icon: "washer", category: "basic", displayOrder: 0 },
  { name: "Dryer", icon: "dryer", category: "basic", displayOrder: 1 },
  { name: "Hangers", icon: "hanger", category: "basic", displayOrder: 2 },
  { name: "Iron", icon: "iron", category: "basic", displayOrder: 3 },
  { name: "TV", icon: "tv", category: "entertainment", displayOrder: 0 },
  { name: "Dedicated workspace", icon: "workspace", category: "basic", displayOrder: 4 },
  { name: "Air Conditioning", icon: "snow", category: "basic", displayOrder: 5 },
  { name: "Heating", icon: "heating", category: "basic", displayOrder: 6 },

  // Safety
  { name: "Security cameras", icon: "camera", category: "safety", displayOrder: 0 },
  { name: "Fire extinguisher", icon: "fire-extinguisher", category: "safety", displayOrder: 1 },
  { name: "First Aid", icon: "first-aid", category: "safety", displayOrder: 2 },

  // Tech
  { name: "Wifi", icon: "wifi", category: "basic", displayOrder: 7 },

  // Kitchen
  { name: "Cooking set", icon: "kitchen", category: "kitchen", displayOrder: 0 },
  { name: "Refrigerator", icon: "fridge", category: "kitchen", displayOrder: 1 },
  { name: "Microwave", icon: "microwave", category: "kitchen", displayOrder: 2 },
  { name: "Stove", icon: "stove", category: "kitchen", displayOrder: 3 },

  // Outdoor
  { name: "Barbecue grill", icon: "bbq", category: "outdoor", displayOrder: 0 },
  { name: "Outdoor dining area", icon: "umbrella", category: "outdoor", displayOrder: 1 },
  { name: "Private patio or Balcony", icon: "balcony", category: "outdoor", displayOrder: 2 },
  { name: "Camp fire", icon: "campfire", category: "outdoor", displayOrder: 3 },
  { name: "Garden", icon: "garden", category: "outdoor", displayOrder: 4 },

  // Other
  { name: "Free parking", icon: "car", category: "other", displayOrder: 0 },
  { name: "Self check-in", icon: "key", category: "other", displayOrder: 1 },
  { name: "Pet allowed", icon: "pets", category: "other", displayOrder: 2 },
];

async function migrateData() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("\n🗑️  Clearing existing data...");
    await Category.deleteMany({});
    await PropertyType.deleteMany({});
    await Facility.deleteMany({});
    console.log("✅ Cleared existing data");

    // Migrate Categories
    console.log("\n📦 Migrating Categories...");
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ Migrated ${categories.length} categories`);

    // Migrate Property Types
    console.log("\n🏠 Migrating Property Types...");
    const types = await PropertyType.insertMany(typesData);
    console.log(`✅ Migrated ${types.length} property types`);

    // Migrate Facilities
    console.log("\n⚙️  Migrating Facilities...");
    const facilities = await Facility.insertMany(facilitiesData);
    console.log(`✅ Migrated ${facilities.length} facilities`);

    console.log("\n✅ Migration completed successfully!");
    console.log("\nSummary:");
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Property Types: ${types.length}`);
    console.log(`  Facilities: ${facilities.length}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run migration
migrateData();

