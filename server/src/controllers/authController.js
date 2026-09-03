const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const { sendMail } = require("../utils/mailer");
const { welcomeEmail, passwordResetEmail } = require("../utils/emailTemplates");

const notify = async (to, { subject, html }) => {
  try {
    await sendMail({ to, subject, html });
  } catch (err) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, err.message);
  }
};

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  // The very first account ever created becomes admin, so there's always at
  // least one admin without needing manual DB edits. Everyone after that is
  // a regular customer.
  const isFirstUser = (await User.countDocuments()) === 0;
  const user = await User.create({
    name,
    email,
    password,
    role: isFirstUser ? "admin" : "customer",
  });

  await notify(user.email, welcomeEmail(user.name));

  res.status(201).json({ user, token: signToken(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  const valid = user && (await user.comparePassword(password));
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ user, token: signToken(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/forgot-password — always responds with a generic success
// message, whether or not the email is registered, so this endpoint can't
// be used to enumerate accounts.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const genericResponse = {
    message: "If an account exists for that email, a reset link has been sent",
  };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const clientOrigin = process.env.CLIENT_ORIGIN?.split(",")[0] || "http://localhost:3000";
  const resetUrl = `${clientOrigin}/reset-password/${rawToken}`;
  await notify(user.email, passwordResetEmail(user.name, resetUrl));

  res.json(genericResponse);
});

// POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: "This reset link is invalid or has expired" });
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: "Password reset — you can now sign in with your new password" });
});

module.exports = { register, login, me, forgotPassword, resetPassword };
