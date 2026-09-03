// One-time import: pulls the starter catalog from fakestoreapi.com and
// writes it into MongoDB, so the app has real data on first run without the
// backend depending on that third-party API at runtime. Requires Node 18+
// (for the built-in fetch).
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");

const seed = async () => {
  await connectDB();

  console.log("Fetching starter catalog from fakestoreapi.com...");
  const response = await fetch("https://fakestoreapi.com/products");
  if (!response.ok) {
    throw new Error(`Failed to fetch seed data: ${response.status}`);
  }
  const products = await response.json();

  await Product.deleteMany({});
  await Category.deleteMany({});

  await Product.insertMany(
    products.map((p) => ({
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      image: p.image,
      rating: p.rating,
    })),
  );

  const categoryNames = [...new Set(products.map((p) => p.category))];
  await Category.insertMany(categoryNames.map((name) => ({ name })));

  console.log(
    `Seeded ${products.length} products across ${categoryNames.length} categories.`,
  );

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
