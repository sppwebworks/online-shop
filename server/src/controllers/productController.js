const Product = require("../models/Product");
const Category = require("../models/Category");
const { asyncHandler } = require("../middleware/errorHandler");

// GET /api/products
// GET /api/products?visibleOnly=true  (storefront: excludes hidden categories)
const getProducts = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.visibleOnly === "true") {
    const hiddenCategories = await Category.find({ hidden: true }).distinct(
      "name",
    );
    if (hiddenCategories.length > 0) {
      filter.category = { $nin: hiddenCategories };
    }
  }

  if (req.query.category) {
    filter.category = req.query.category.toLowerCase();
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    price,
    description,
    category,
    image,
    images,
    colorImages,
    originalPrice,
    brand,
    weight,
    gender,
    sku,
    variants,
  } = req.body;
  if (!title || price == null || !description || !category || !image) {
    return res.status(400).json({ message: "Missing required product fields" });
  }

  const product = await Product.create({
    title,
    price,
    description,
    category,
    image,
    images,
    colorImages,
    originalPrice: originalPrice || null,
    brand,
    weight,
    gender,
    sku,
    variants,
  });
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ message: "Product deleted" });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
