const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const { asyncHandler } = require("../middleware/errorHandler");

// Keeps Product.rating (the average/count shown everywhere else in the app)
// in sync with the real review data — no separate source of truth to drift.
const recomputeProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: {
      rate: stats ? Math.round(stats.avg * 10) / 10 : 0,
      count: stats ? stats.count : 0,
    },
  });
};

// GET /api/products/:id/reviews
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
  res.json(reviews);
});

// POST /api/products/:id/reviews — create or update the logged-in user's
// own review for this product.
const VALID_FITS = ["", "small", "true_to_size", "large"];

const upsertReview = asyncHandler(async (req, res) => {
  const { rating, comment, fit, images } = req.body;
  const ratingNum = Number(rating);

  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: "Please write a comment" });
  }
  if (fit && !VALID_FITS.includes(fit)) {
    return res.status(400).json({ message: "Invalid fit value" });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = await Review.findOneAndUpdate(
    { product: req.params.id, user: req.user._id },
    {
      product: req.params.id,
      user: req.user._id,
      userName: req.user.name,
      rating: ratingNum,
      comment: comment.trim(),
      fit: fit || "",
      images: Array.isArray(images) ? images.slice(0, 5) : [],
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await recomputeProductRating(req.params.id);

  res.status(201).json(review);
});

// DELETE /api/products/:id/reviews/me
const deleteMyReview = asyncHandler(async (req, res) => {
  const result = await Review.findOneAndDelete({
    product: req.params.id,
    user: req.user._id,
  });
  if (!result) {
    return res.status(404).json({ message: "You haven't reviewed this product" });
  }

  await recomputeProductRating(req.params.id);

  res.json({ message: "Review deleted" });
});

module.exports = { getProductReviews, upsertReview, deleteMyReview };
