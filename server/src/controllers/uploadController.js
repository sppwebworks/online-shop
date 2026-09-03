const { asyncHandler } = require("../middleware/errorHandler");

// POST /api/uploads — admin uploads an image file (product or category
// artwork) and gets back an absolute URL it can store on that record's
// `image` field, exactly like a pasted image URL would be.
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file was uploaded" });
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

module.exports = { uploadImage };
