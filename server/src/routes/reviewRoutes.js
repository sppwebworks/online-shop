const express = require("express");
const {
  getProductReviews,
  upsertReview,
  deleteMyReview,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.get("/", getProductReviews);
router.post("/", protect, upsertReview);
router.delete("/me", protect, deleteMyReview);

module.exports = router;
