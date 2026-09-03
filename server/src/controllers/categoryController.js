const Category = require("../models/Category");
const Product = require("../models/Product");
const { asyncHandler } = require("../middleware/errorHandler");

// GET /api/categories — each category comes back with a live product count,
// and an image borrowed from its first product if none was set manually.
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });

  const counts = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countByName = Object.fromEntries(
    counts.map((c) => [c._id, c.count]),
  );

  const withThumbnails = await Promise.all(
    categories.map(async (category) => {
      let image = category.image;
      if (!image) {
        const sample = await Product.findOne({ category: category.name });
        image = sample?.image || "";
      }
      return {
        ...category.toJSON(),
        image,
        autoImage: !category.image && Boolean(image),
        productCount: countByName[category.name] || 0,
      };
    }),
  );

  res.json(withThumbnails);
});

const createCategory = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim().toLowerCase();
  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const existing = await Category.findOne({ name });
  if (existing) {
    return res.status(409).json({ message: "That category already exists" });
  }

  const category = await Category.create({
    name,
    image: req.body.image?.trim() || "",
  });
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const nextName = req.body.name?.trim().toLowerCase();
  if (nextName && nextName !== category.name) {
    const clash = await Category.findOne({ name: nextName });
    if (clash) {
      return res.status(409).json({ message: "That category already exists" });
    }
    // Products store the category as a plain string, so a rename has to be
    // propagated to every product that referenced the old name.
    await Product.updateMany(
      { category: category.name },
      { category: nextName },
    );
    category.name = nextName;
  }

  if (req.body.image !== undefined) {
    category.image = req.body.image.trim();
  }
  if (req.body.hidden !== undefined) {
    category.hidden = req.body.hidden;
  }

  await category.save();
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const inUse = await Product.exists({ category: category.name });
  if (inUse) {
    return res.status(409).json({
      message: "Can't delete a category that still has products in it",
    });
  }

  await category.deleteOne();
  res.json({ message: "Category deleted" });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
