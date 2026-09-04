const Order = require("../models/Order");
const Product = require("../models/Product");
const { asyncHandler } = require("../middleware/errorHandler");
const { getStripe } = require("../config/stripe");
const { sendMail } = require("../utils/mailer");
const {
  orderConfirmationEmail,
  orderStatusUpdateEmail,
  orderCancelledEmail,
  returnRequestedEmail,
  returnDecisionEmail,
  adminReturnNotificationEmail,
} = require("../utils/emailTemplates");

const VALID_PAYMENT_METHODS = ["card", "upi", "netbanking", "wallet", "cod"];
const CANCELLABLE_STATUSES = ["pending", "processing"];
const RETURN_WINDOW_DAYS = 7;

// Emails are best-effort: a failed send should never fail the request that
// triggered it, so every call site goes through this and only logs.
const notify = async (to, { subject, html }) => {
  try {
    await sendMail({ to, subject, html });
  } catch (err) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, err.message);
  }
};

// Mutates `order` in place (paymentStatus/stripeRefundId) — caller is
// responsible for saving. Only card payments go through a real Stripe
// refund; the other methods were never a real gateway in the first place,
// so "refunding" them is just flipping the recorded status.
const refundOrderPayment = async (order) => {
  if (order.paymentStatus !== "paid") return;

  if (order.paymentMethod === "card" && order.stripePaymentIntentId) {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
    order.stripeRefundId = refund.id;
  }

  order.paymentStatus = "refunded";
};

// Restocking is always safe to attempt even for products that were never
// variant-tracked (no matching variant just means matchedCount 0 — a no-op).
const restockItems = async (items) => {
  for (const item of items) {
    if (!item.product) continue;
    await Product.updateOne(
      {
        _id: item.product,
        "variants.size": item.size || "",
        "variants.color": item.color || "",
      },
      { $inc: { "variants.$.stock": item.quantity } },
    );
  }
};

// Decrements variant stock for every item, atomically and conditionally
// (stock >= quantity) so two concurrent checkouts can never both succeed
// against the last unit. Standalone MongoDB here has no multi-document
// transactions, so on a mid-loop failure we manually roll back the items
// already decremented rather than relying on one. Products with no
// `variants` (created before this feature, or never given a size/color
// axis) are left alone — stock isn't tracked for them, so they're always
// available, matching prior behavior.
const decrementStockForItems = async (items) => {
  const decremented = [];
  for (const item of items) {
    if (!item.product) continue;

    const product = await Product.findById(item.product).select("variants");
    if (!product || product.variants.length === 0) continue;

    const result = await Product.updateOne(
      {
        _id: item.product,
        "variants.size": item.size || "",
        "variants.color": item.color || "",
        "variants.stock": { $gte: item.quantity },
      },
      { $inc: { "variants.$.stock": -item.quantity } },
    );

    if (result.matchedCount === 0) {
      await restockItems(decremented);
      const variantLabel = [item.size, item.color].filter(Boolean).join(" / ");
      return {
        ok: false,
        message: `"${item.title}"${variantLabel ? ` (${variantLabel})` : ""} doesn't have enough stock`,
      };
    }
    decremented.push(item);
  }
  return { ok: true };
};

// POST /api/orders — customer places an order from their cart. There's no
// real payment gateway for upi/netbanking/wallet/cod: any raw details for
// those stay entirely on the client and are never sent to this endpoint —
// only the chosen method is recorded, and every method except COD is
// treated as paid immediately (simulating a successful gateway callback).
// "card" is the one real gateway: the client must have already confirmed a
// Stripe PaymentIntent, and we re-verify it here (status, amount, owner)
// before trusting the client's claim that it succeeded — Stripe is the
// source of truth, never the request body.
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, stripePaymentIntentId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order must include at least one item" });
  }
  if (!shippingAddress) {
    return res.status(400).json({ message: "Shipping address is required" });
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const requiredAddressFields = [
    "fullName",
    "line1",
    "city",
    "state",
    "postalCode",
    "phone",
  ];
  const missing = requiredAddressFields.filter((f) => !shippingAddress[f]);
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing shipping address fields: ${missing.join(", ")}`,
    });
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  let paymentStatus = paymentMethod === "cod" ? "pending" : "paid";
  let verifiedIntentId = null;

  if (paymentMethod === "card") {
    if (!stripePaymentIntentId) {
      return res.status(400).json({ message: "Missing Stripe payment confirmation" });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (!intent || intent.status !== "succeeded") {
      return res.status(402).json({ message: "Payment has not succeeded" });
    }
    if (intent.metadata?.userId !== String(req.user._id)) {
      return res.status(403).json({ message: "Payment does not belong to this user" });
    }
    const expectedCents = Math.round(totalAmount * 100);
    if (intent.amount !== expectedCents) {
      return res.status(400).json({ message: "Paid amount does not match order total" });
    }

    const alreadyUsed = await Order.findOne({ stripePaymentIntentId });
    if (alreadyUsed) {
      return res.status(409).json({ message: "This payment has already been used for an order" });
    }

    paymentStatus = "paid";
    verifiedIntentId = stripePaymentIntentId;
  }

  const stockResult = await decrementStockForItems(items);
  if (!stockResult.ok) {
    // The card charge (if any) already succeeded before we got here — don't
    // leave the customer charged for an order that can't actually be
    // fulfilled.
    if (paymentMethod === "card" && verifiedIntentId) {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: verifiedIntentId });
    }
    return res.status(409).json({ message: stockResult.message });
  }

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    totalAmount,
    paymentMethod,
    paymentStatus,
    stripePaymentIntentId: verifiedIntentId,
  });

  notify(req.user.email, orderConfirmationEmail(order));

  res.status(201).json(order);
});

// GET /api/orders/my — the logged-in user's own orders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

// GET /api/orders — admin: every order
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/orders/:id/status — admin: advance order status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const wasAlreadyCancelled = order.status === "cancelled";
  order.status = status;
  if (status === "delivered") {
    order.deliveredAt = new Date();
  }
  if (status === "cancelled" && !wasAlreadyCancelled) {
    order.cancelledAt = new Date();
    await refundOrderPayment(order);
    await restockItems(order.items);
  }
  await order.save();

  if (order.user?.email) {
    notify(
      order.user.email,
      status === "cancelled" ? orderCancelledEmail(order) : orderStatusUpdateEmail(order),
    );
  }

  res.json(order);
});

// POST /api/orders/:id/cancel — customer cancels their own order. Mirrors
// most real storefronts: cancellable any time before it ships, locked once
// it's shipped/delivered/already cancelled.
const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return res.status(400).json({
      message: "This order can no longer be cancelled — it has already shipped",
    });
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  await refundOrderPayment(order);
  await restockItems(order.items);
  await order.save();

  notify(req.user.email, orderCancelledEmail(order));

  res.json(order);
});

// POST /api/orders/:id/return — customer requests a return or exchange
// within RETURN_WINDOW_DAYS of delivery.
const requestReturn = asyncHandler(async (req, res) => {
  const { type, reason } = req.body;
  if (!["return", "exchange"].includes(type)) {
    return res.status(400).json({ message: "type must be 'return' or 'exchange'" });
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.status !== "delivered" || !order.deliveredAt) {
    return res.status(400).json({ message: "Only delivered orders can be returned or exchanged" });
  }
  if (order.returnStatus !== "none") {
    return res.status(400).json({ message: "A return/exchange request already exists for this order" });
  }

  const daysSinceDelivery = (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return res.status(400).json({
      message: `The return window (${RETURN_WINDOW_DAYS} days after delivery) has passed`,
    });
  }

  order.returnType = type;
  order.returnStatus = "requested";
  order.returnReason = reason || null;
  order.returnRequestedAt = new Date();
  await order.save();

  notify(req.user.email, returnRequestedEmail(order));
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    notify(process.env.ADMIN_NOTIFY_EMAIL, adminReturnNotificationEmail(order));
  }

  res.json(order);
});

// PUT /api/orders/:id/return — admin approves or rejects a pending
// return/exchange request. Approving a paid order refunds it.
const reviewReturn = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "decision must be 'approved' or 'rejected'" });
  }

  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.returnStatus !== "requested") {
    return res.status(400).json({ message: "No pending return/exchange request on this order" });
  }

  order.returnStatus = decision;
  order.returnDecidedAt = new Date();
  if (decision === "approved") {
    await refundOrderPayment(order);
    await restockItems(order.items);
  }
  await order.save();

  if (order.user?.email) {
    notify(order.user.email, returnDecisionEmail(order));
  }

  res.json(order);
});

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
  requestReturn,
  reviewReturn,
};
