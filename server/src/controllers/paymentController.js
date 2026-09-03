const { asyncHandler } = require("../middleware/errorHandler");
const { getStripe } = require("../config/stripe");

// POST /api/payments/create-intent — creates a Stripe PaymentIntent for the
// given amount so the client can collect card details with Stripe Elements
// and confirm payment directly with Stripe (card details never touch our
// server).
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "A positive amount is required" });
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects the smallest currency unit (cents)
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { userId: String(req.user._id) },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

module.exports = { createPaymentIntent };
