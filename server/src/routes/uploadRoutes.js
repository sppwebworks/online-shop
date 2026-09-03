const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

// Multer's own errors (e.g. file too large) arrive as MulterError with no
// `.status` — without this they'd fall through to the generic handler's
// 500 default, even though they're really a 400 (bad request from the
// client), not a server failure.
const handleUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      err.status = 400;
    }
    next(err);
  });
};

// Any authenticated user, not just admins — this endpoint now also backs
// customer review photo uploads, not just admin product/category images.
router.post("/", protect, handleUpload, uploadImage);

module.exports = router;
