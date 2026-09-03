const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res
      .status(409)
      .json({ message: "An account with that email already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === "admin" ? "admin" : "customer",
  });
  res.status(201).json(user);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["admin", "customer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin" && role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res
        .status(409)
        .json({ message: "Can't demote the last remaining admin" });
    }
  }

  user.role = role;
  await user.save();
  res.json(user);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: "You can't delete your own account" });
  }

  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res
        .status(409)
        .json({ message: "Can't delete the last remaining admin" });
    }
  }

  await user.deleteOne();
  res.json({ message: "User deleted" });
});

module.exports = { getUsers, createUser, updateUserRole, deleteUser };
