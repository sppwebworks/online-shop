const express = require("express");
const {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Every route here is admin-only — user management isn't a self-service
// feature.
router.use(protect, adminOnly);

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

module.exports = router;
