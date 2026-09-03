const express = require("express");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
  requestReturn,
  reviewReturn,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);
router.post("/:id/cancel", protect, cancelMyOrder);
router.post("/:id/return", protect, requestReturn);
router.put("/:id/return", protect, adminOnly, reviewReturn);

module.exports = router;
